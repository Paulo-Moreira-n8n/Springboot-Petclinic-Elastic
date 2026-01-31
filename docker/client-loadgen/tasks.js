// tasks.js

const puppeteer = require('puppeteer');
const csv = require('csvtojson');

// Lê argumentos da linha de comando
const args = process.argv.slice(2);
const usersFile = args[1]; // Corrigido: primeiro argumento é o arquivo de usuários
const delayPerUser = args[2]; // ex: "20000:10000"
const delayPerPage = args[3]; // ex: "120000:20000"

if (!usersFile || !delayPerUser || !delayPerPage) {
  console.error('Uso: node tasks.js <users.csv> <delay_per_user> <delay_per_page>');
  console.error('Ex: node tasks.js users.csv 20000:10000 120000:20000');
  process.exit(1);
}

const [delayPerUserAvg, delayPerUserDev] = delayPerUser.split(':').map(Number);
const [delayPerPageAvg, delayPerPageDev] = delayPerPage.split(':').map(Number);

// Validação
if (isNaN(delayPerUserAvg) || isNaN(delayPerPageAvg)) {
  console.error('Delays inválidos. Use formato: N:M (ex: 20000:10000)');
  console.error(`Users file: ${usersFile}, Delay Per User: ${delayPerUser}, Delay Per Page: ${delayPerPage}`);
  process.exit(1);
}

const baseUrl = process.env.PETCLINIC_BASE_URL || 'http://spring-petclinic-client:3000';
console.log('Starting loadgenerator...');
console.log(`Users file: ${usersFile}, Delay Per User: ${delayPerUser}, Delay Per Page: ${delayPerPage}`);
console.log(JSON.stringify(baseUrl));

// Função para ler CSV
async function readCSV(filename) {
  return await csv({
    noheader: true,
    headers: ['username', 'ip', 'agent']
  }).fromFile(filename);
}

// Função sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal de navegação
async function run(browser, username, ip, agent, currentUrl) {
  const page = await browser.newPage();

  // Configura headers e user agent
  await page.setExtraHTTPHeaders({
    'x-forwarded-for': ip,
    'x-forwarded-user': username,
    'x-forwarded-ip': ip
  });
  await page.setUserAgent(agent);

  try {
    await page.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Avalia no navegador: navegação aleatória com bias para URLs mais longas
    const newUrl = await page.evaluate((baseUrl, avg, dev) => {
      const delay = avg + Math.floor(Math.random() * dev);
      let timer;

      const navigate = () => {
        const links = Array.from(document.querySelectorAll('a[href^="/"]'));
        const uniq = new Map();
        let minLen = Infinity;
        let maxLen = 0;

        for (const link of links) {
          if (!link.href) continue;
          uniq.set(link.href, link);
          const len = link.href.length;
          if (len < minLen) minLen = len;
          if (len > maxLen) maxLen = len;
        }

        if (uniq.size === 0) {
          clearInterval(timer);
          return baseUrl;
        }

        // Bias para links mais longos
        const diff = maxLen === minLen ? 1 : 10 / (maxLen - minLen);
        const weightedLinks = [];
        for (const [href, link] of uniq.entries()) {
          const weight = Math.max(1, Math.floor((href.length - minLen + 1) * diff));
          for (let i = 0; i < weight; i++) {
            weightedLinks.push(link);
          }
        }

        if (weightedLinks.length > 0) {
          const randomLink = weightedLinks[Math.floor(Math.random() * weightedLinks.length)];
          randomLink.click();
          return randomLink.href;
        }

        return baseUrl;
      };

      // Navega uma vez imediatamente
      const result = navigate();

      // Agenda navegações repetidas
      timer = setInterval(navigate, delay);
      // Obs: o timer continua rodando, mas não precisamos retornar URL dinâmica

      return result;
    }, baseUrl, delayPerPageAvg, delayPerPageDev);

    // Aguarda um tempo antes de fechar (simula usuário navegando)
    await sleep(delayPerPageAvg + Math.floor(Math.random() * delayPerPageDev));

    // Fecha a página para liberar memória
    await page.close();
    return newUrl || baseUrl;
  } catch (error) {
    console.error(`Erro ao processar URL ${currentUrl}:`, error.message);
    await page.close();
    return baseUrl;
  }
}

// Loop principal
async function safeRun() {
  console.log(`Starting from baseurl: ${baseUrl}`);
  const users = await readCSV(usersFile);
  console.log(`Loaded ${users.length} users`);

  // Inicia o navegador **uma única vez** (eficiência)
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process'
    ]
  });

  let currentUrl = baseUrl;

  for (;;) {
    const user = users[Math.floor(Math.random() * users.length)];
    console.log(`Handling ${currentUrl} for user ${user.username}`);

    try {
      currentUrl = await run(browser, user.username, user.ip, user.agent, currentUrl);
    } catch (error) {
      console.error('Falha na execução do usuário:', error);
      currentUrl = baseUrl; // Reinicia
    }

    // Delay entre usuários
    const userDelay = delayPerUserAvg + Math.floor(Math.random() * delayPerUserDev);
    await sleep(userDelay);
  }
}

// Tratamento de erros globais
safeRun().catch(err => {
  console.error('Erro fatal no load generator:', err);
  process.exit(1);
});

// Encerra o navegador se o processo for interrompido
process.on('SIGINT', async () => {
  console.log('Encerrando...');
  await browser?.close();
  process.exit(0);
});