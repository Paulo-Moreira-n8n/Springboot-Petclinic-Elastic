// tasks.js (versão ajustada para CORS/APM e X-Forwarded-* seletivos)

"use strict";

const puppeteer = require('puppeteer');
const csv = require('csvtojson');
const { enableSelectiveHeaders } = require('./puppeteer_interceptors');

// -----------------------------------------------------------------------------
// Leitura de argumentos da linha de comando
// -----------------------------------------------------------------------------
const args = process.argv.slice(2);

// aqui mantemos a convenção: args[1]=usersFile, args[2]=delayPerUser, args[3]=delayPerPage
const usersFile = args[1];
const delayPerUser = args[2]; // ex: "20000:10000"
const delayPerPage = args[3]; // ex: "120000:20000"

if (!usersFile || !delayPerUser || !delayPerPage) {
  console.error('Uso: node tasks.js <users.csv> <delay_per_user> <delay_per_page>');
  console.error('Ex:  node tasks.js users.csv 20000:10000 120000:20000');
  process.exit(1);
}

const [delayPerUserAvg, delayPerUserDev] = delayPerUser.split(':').map(Number);
const [delayPerPageAvg, delayPerPageDev] = delayPerPage.split(':').map(Number);

// Validação básica
if (isNaN(delayPerUserAvg) || isNaN(delayPerUserDev) || isNaN(delayPerPageAvg) || isNaN(delayPerPageDev)) {
  console.error('Delays inválidos. Use formato: N:M (ex: 20000:10000)');
  console.error(`Users file: ${usersFile}, Delay Per User: ${delayPerUser}, Delay Per Page: ${delayPerPage}`);
  process.exit(1);
}

const baseUrl = process.env.PETCLINIC_BASE_URL || 'http://spring-petclinic-client:3000';

console.log('Starting loadgenerator...');
console.log(`Users file: ${usersFile}, Delay Per User: ${delayPerUser}, Delay Per Page: ${delayPerPage}`);
console.log(`Base URL: ${baseUrl}`);

// -----------------------------------------------------------------------------
// Utilitários
// -----------------------------------------------------------------------------
async function readCSV(filename) {
  return await csv({
    noheader: true,
    headers: ['username', 'ip', 'agent']
  }).fromFile(filename);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// -----------------------------------------------------------------------------
// Core de execução por usuário/página
// -----------------------------------------------------------------------------
async function run(browser, username, ip, agent, currentUrl) {
  const page = await browser.newPage();

  // Interceptor seletivo:
  // - injeta X-Forwarded-* apenas quando o destino for a origem do front (APP)
  // - remove X-Forwarded-* quando o destino for o APM (RUM)
  const xf = {
    'x-forwarded-for': ip,
    'x-forwarded-user': username,
    'x-forwarded-ip': ip
  };
  await enableSelectiveHeaders(page, xf);

  // Listeners (opcionais) de diagnóstico
  page.on('console', (msg) => console.log('[PAGE]', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.error('[PAGE ERROR]', err.message));
  page.on('requestfailed', (req) =>
    console.error('[REQ FAILED]', req.url(), req.failure()?.errorText)
  );

  // Define o user-agent informado no CSV (mantido)
  await page.setUserAgent(agent);

  try {
    await page.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Navegação aleatória com viés para links mais longos (mantido do original)
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

      // navega imediatamente uma vez
      const result = navigate();

      // agenda novas navegações periódicas
      timer = setInterval(navigate, delay);
      // OBS: o timer continua rodando na página

      return result;
    }, baseUrl, delayPerPageAvg, delayPerPageDev);

    // Simula permanência do usuário antes de fechar
    await sleep(delayPerPageAvg + Math.floor(Math.random() * delayPerPageDev));

    await page.close();
    return newUrl || baseUrl;
  } catch (error) {
    console.error(`Erro ao processar URL ${currentUrl}:`, error.message);
    try { await page.close(); } catch (_) {}
    return baseUrl;
  }
}

// -----------------------------------------------------------------------------
// Loop principal
// -----------------------------------------------------------------------------
async function safeRun() {
  console.log(`Starting from baseurl: ${baseUrl}`);
  const users = await readCSV(usersFile);
  console.log(`Loaded ${users.length} users`);

  // Lança um único navegador para eficiência
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

// Finalização graciosa
let browser; // (se quiser fechar explicitamente, mantenha referência fora)
process.on('SIGINT', async () => {
  console.log('Encerrando...');
  try { await browser?.close(); } catch (_) {}
  process.exit(0);
});