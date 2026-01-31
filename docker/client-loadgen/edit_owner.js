// edit_owner.js

const puppeteer = require('puppeteer');
const csv = require('csvtojson');

const usersFile = './users.csv';
const zipCodeFile = './zip_codes.csv';

// Configuração
const baseUrl = process.env.PETCLINIC_BASE_URL || 'http://localhost:3000';
const userIds = Array.from({ length: 10 }, (_, i) => i + 1); // [1,2,...,10]

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

const RANDOM_IPS = Array.from({ length: 1000 }, () => randomIp());

// Leitura de CSV
async function readCSV(filename, headers) {
  return await csv({ noheader: true, headers }).fromFile(filename);
}

// Função sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para gerar delay aleatório (3000–5000 ms)
function randomDelay() {
  return 3000 + Math.floor(Math.random() * 2000);
}

// Lógica principal de edição do owner
async function run(page, username, ip, agent, zipCode) {
  console.log(`Using username: ${username}, ip: ${ip}, agent: ${agent}`);

  // Configura headers e user agent
  await page.setExtraHTTPHeaders({
    'x-forwarded-for': ip,
    'x-forwarded-user': username,
    'x-forwarded-ip': ip
  });
  await page.setUserAgent(agent);

  // Gera zip code lento ou inválido (5% das vezes)
  let finalZipCode = zipCode;
  const slowZipChance = Math.random();
  if (slowZipChance < 0.05) {
    console.log('Using error zip code');
    if (slowZipChance < 0.01) {
      console.log('Using extremely slow zip code');
      const chars = "0123456789";
      let zip = '';
      // Parte antes do hífen
      const len1 = 29 + Math.floor(Math.random() * 10);
      for (let i = 0; i < len1; i++) {
        zip += chars[Math.floor(Math.random() * chars.length)];
      }
      zip += '-';
      // Parte depois do hífen
      const len2 = 29 + Math.floor(Math.random() * 10);
      for (let i = 0; i < len2; i++) {
        zip += chars[Math.floor(Math.random() * chars.length)];
      }
      // Adiciona letra no final
      const letters = "abcdefghijklmnopqrstuvwxyz";
      zip += letters[Math.floor(Math.random() * letters.length)];
      finalZipCode = zip;
    } else {
      finalZipCode += Math.random().toString(36).substring(Math.floor(Math.random() * 10));
    }
  }

  console.log('Zip code:', finalZipCode);

  // Navega para a página
  await page.goto(page.url(), { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Preenche o zip code
  await page.type('input[name="address"]', finalZipCode, { delay: 0 });
  await page.evaluate(() => {
    document.querySelector('input[name="address"]').dispatchEvent(new Event('blur', { bubbles: true }));
  });
  await sleep(randomDelay());

  // Seleciona estado aleatório
//  const stateOptions = await page.$$eval('select[name="state"] option', opts => opts.length);
//  if (stateOptions > 1) {
//    const randomStateIndex = 1 + Math.floor(Math.random() * (stateOptions - 1)); // evita índice 0
//    await page.select('select[name="state"]', String(randomStateIndex));
//    await page.evaluate(() => {
//      document.querySelector('select[name="state"]').dispatchEvent(new Event('change', { bubbles: true }));
//    });
//  }
//  await sleep(randomDelay());

  // Seleciona cidade aleatória
//  const cityOptions = await page.$$eval('select[name="city"] option', opts => opts.length);
//  if (cityOptions > 1) {
//    const randomCityIndex = 1 + Math.floor(Math.random() * (cityOptions - 1));
//    await page.select('select[name="city"]', String(randomCityIndex));
//    await page.evaluate(() => {
//      document.querySelector('select[name="city"]').dispatchEvent(new Event('change', { bubbles: true }));
//    });
//  }
//  await sleep(randomDelay());

  // Simula interação com React Autosuggest
//  const address = await page.$eval('select[name="city"]', el => el.value + ' ');
//  await page.evaluate(address => {
//    const input = document.querySelector('.react-autosuggest__input');
//    if (input) {
//      input.focus();
//      // Simula preenchimento via React (se necessário, ajuste conforme o app)
//    }
//  }, address);
//  await sleep(500);

  // Clica em uma sugestão (se existir)
//  const suggestions = await page.$$('.react-autosuggest__suggestion');
//  if (suggestions.length > 0) {
//    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
//    await randomSuggestion.click();
//  }
//  await sleep(randomDelay());

  // Clica no botão de submit
  const submitButtons = await page.$$('button[type="submit"]');
  if (submitButtons.length > 0) {
    await submitButtons[0].click();
  }

  // Aguarda navegação após submit (opcional)
  try {
    await page.waitForNavigation({ timeout: 10000 });
  } catch (e) {
    // Ignora timeout de navegação (pode não redirecionar)
  }
}

// Loop principal
async function safeRun() {
  const users = await readCSV(usersFile, ['username', 'ip', 'agent']);
  const zipCodes = await readCSV(zipCodeFile, ['zip_code']);
  console.log(`Loaded ${users.length} users`);
  console.log(`Loaded ${zipCodes.length} zip codes`);

  // Lança o navegador uma vez
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

  for (;;) {
    const user = users[Math.floor(Math.random() * users.length)];
    const zipEntry = zipCodes[Math.floor(Math.random() * zipCodes.length)];
    const zipCode = zipEntry.zip_code;

    // Seleciona owner ID aleatório
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const editUrl = `${baseUrl}/owners/${userId}/edit`;
    console.log('Handling', editUrl);

    const page = await browser.newPage();
    await page.goto(editUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    try {
      await run(page, user.username, user.ip, user.agent, zipCode);
    } catch (error) {
      console.error('Failed for URL:', editUrl, error.message);
    } finally {
      await page.close();
    }

    // Delay entre iterações
    await sleep(60000 + Math.floor(Math.random() * 10000));
  }
}

// Tratamento de erros
safeRun().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

// Encerramento gracioso
let browser;
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  if (browser) await browser.close();
  process.exit(0);
});