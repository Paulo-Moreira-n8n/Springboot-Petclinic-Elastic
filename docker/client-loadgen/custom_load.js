// custom_load.js

const puppeteer = require('puppeteer');
const csv = require('csvtojson');

const usersFile = './users.csv';
const baseUrl = process.env.PETCLINIC_BASE_URL || 'http://localhost:8081/owners/list';

// Geração de IPs aleatórios (não privados)
function randomByte() {
  return Math.floor(Math.random() * 256);
}

function isPrivate(ip) {
  return /^10\.|^192\.168\.|^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip);
}

function randomIp() {
  let ip;
  do {
    ip = `${randomByte()}.${randomByte()}.${randomByte()}.${randomByte()}`;
  } while (isPrivate(ip));
  return ip;
}

const NUM_IPS = 1000;
const RANDOM_IPS = Array.from({ length: NUM_IPS }, () => randomIp());

// Leitura de CSV
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

// Navegação entre owners e vets
async function navigate(page, currentUrl, baseUrl) {
  try {
    await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Verifica a URL atual e decide o próximo clique
    let nextUrl;
    if (currentUrl.includes('/vets')) {
      // Está em /vets → vai para /owners/list
      const ownerLink = await page.$('a[href^="/owners/list"]');
      if (ownerLink) {
        const href = await page.evaluate(el => el.href, ownerLink);
        await ownerLink.click();
        nextUrl = href;
      } else {
        nextUrl = baseUrl;
      }
    } else {
      // Está em /owners/list → vai para /vets
      const vetLink = await page.$('a[href^="/vets"]');
      if (vetLink) {
        const href = await page.evaluate(el => el.href, vetLink);
        await vetLink.click();
        nextUrl = href;
      } else {
        // Fallback: navegação aleatória
        const links = await page.$$('a[href^="/"]');
        if (links.length > 0) {
          const randomLink = links[Math.floor(Math.random() * links.length)];
          const href = await page.evaluate(el => el.href, randomLink);
          await randomLink.click();
          next url = href;
        } else {
          nextUrl = baseUrl;
        }
      }
    }

    // Aguarda navegação após clique
    try {
      await page.waitForNavigation({ timeout: 10000 });
    } catch (e) {
      // Ignora se não houver redirecionamento
    }

    return nextUrl || baseUrl;
  } catch (error) {
    console.error(`Erro ao navegar de ${currentUrl}:`, error.message);
    return baseUrl;
  }
}

// Execução por usuário
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
    const newUrl = await navigate(page, currentUrl, baseUrl);
    console.log(`Navigated to: ${newUrl}`);
    return newUrl;
  } finally {
    await page.close();
  }
}

// Loop principal
async function safeRun() {
  console.log(`Starting from baseurl: ${baseUrl}`);
  const users = await readCSV(usersFile);
  console.log(`Loaded ${users.length} users`);

  // Lança o navegador uma única vez
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
      console.error('Falha na execução:', error);
      currentUrl = baseUrl;
    }

    // Delay entre usuários: 20s + aleatório até 10s
    await sleep(20000 + Math.floor(Math.random() * 10000));
  }
}

// Tratamento de erros globais
safeRun().catch(err => {
  console.error('Erro fatal no base worker:', err);
  process.exit(1);
});

// Encerramento gracioso
process.on('SIGINT', async () => {
  console.log('Encerrando base_worker...');
  // O browser será encerrado automaticamente ao sair do processo
  process.exit(0);
});