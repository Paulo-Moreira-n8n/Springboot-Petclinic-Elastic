// single_slow_owner.js

const puppeteer = require('puppeteer');
const csv = require('csvtojson');

const usersFile = './users.csv';
const baseUrl = process.env.PETCLINIC_BASE_URL || 'http://localhost:3000';

// Geração de slow zip code (exatamente como no original)
function generateSlowZipCode() {
  console.log('Using slow zip code as well');
  const digits = "0123456789";
  let zip = '';

  // Parte antes do hífen
  const len1 = 29 + Math.floor(Math.random() * 10);
  for (let i = 0; i < len1; i++) {
    zip += digits[Math.floor(Math.random() * digits.length)];
  }
  zip += '-';

  // Parte depois do hífen
  const len2 = 29 + Math.floor(Math.random() * 10);
  for (let i = 0; i < len2; i++) {
    zip += digits[Math.floor(Math.random() * digits.length)];
  }

  // Adiciona uma letra no final
  const letters = "abcdefghijklmnopqrstuvwxyz";
  zip += letters[Math.floor(Math.random() * letters.length)];

  console.log('Zip code:', zip);
  return zip;
}

// Leitura de CSV
async function readCSV(filename, headers) {
  return await csv({ noheader: true, headers }).fromFile(filename);
}

// Função para delay aleatório (3000–5000 ms)
function randomDelay() {
  return 3000 + Math.floor(Math.random() * 2000);
}

// Execução principal
async function run(page, username, ip, agent) {
  console.log(`Using username: ${username}, ip: ${ip}, agent: ${agent}`);

  // Configura headers e user agent
  await page.setExtraHTTPHeaders({
    'x-forwarded-for': ip,
    'x-forwarded-user': username,
    'x-forwarded-ip': ip
  });
  await page.setUserAgent(agent);

  // Seleciona um owner aleatório
  const userIds = Array.from({ length: 10 }, (_, i) => i + 1);
  const userId = userIds[Math.floor(Math.random() * userIds.length)];
  const editUrl = `${baseUrl}/owners/${userId}/edit`;
  console.log('Handling', editUrl);

  // Navega para a página de edição
  await page.goto(editUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Gera e preenche o slow zip code
  const zipCode = generateSlowZipCode();
  await page.type('input[name="zipCode"]', zipCode, { delay: 0 });
  await page.evaluate(() => {
    document.querySelector('input[name="zipCode"]').dispatchEvent(new Event('blur', { bubbles: true }));
  });
  await new Promise(resolve => setTimeout(resolve, randomDelay()));

  // Seleciona estado
  const stateOptions = await page.$$eval('select[name="state"] option', opts => opts.length);
  if (stateOptions > 1) {
    const idx = 1 + Math.floor(Math.random() * (stateOptions - 1));
    await page.select('select[name="state"]', String(idx));
    await page.evaluate(() => {
      document.querySelector('select[name="state"]').dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  await new Promise(resolve => setTimeout(resolve, randomDelay()));

  // Seleciona cidade
  const cityOptions = await page.$$eval('select[name="city"] option', opts => opts.length);
  if (cityOptions > 1) {
    const idx = 1 + Math.floor(Math.random() * (cityOptions - 1));
    await page.select('select[name="city"]', String(idx));
    await page.evaluate(() => {
      document.querySelector('select[name="city"]').dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  await new Promise(resolve => setTimeout(resolve, randomDelay()));

  // Simula interação com React Autosuggest
  const address = await page.$eval('select[name="city"]', el => el.value + ' ');
  await page.evaluate(address => {
    const input = document.querySelector('.react-autosuggest__input');
    if (input) input.focus();
  }, address);
  await new Promise(resolve => setTimeout(resolve, 500));

  // Clica em sugestão (se existir)
  const suggestions = await page.$$('.react-autosuggest__suggestion');
  if (suggestions.length > 0) {
    await suggestions[Math.floor(Math.random() * suggestions.length)].click();
  }
  await new Promise(resolve => setTimeout(resolve, randomDelay()));

  // Clica no botão de submit
  const submitButtons = await page.$$('button[type="submit"]');
  if (submitButtons.length > 0) {
    await submitButtons[0].click();
  }

  // Aguarda possível navegação
  try {
    await page.waitForNavigation({ timeout: 10000 });
  } catch (e) {
    // OK se não houver redirecionamento
  }
}

// Execução única (não é loop)
async function safeRun() {
  const users = await readCSV(usersFile, ['username', 'ip', 'agent']);
  console.log(`Loaded ${users.length} users`);

  const user = users[Math.floor(Math.random() * users.length)];

  // Lança o navegador
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

  const page = await browser.newPage();

  try {
    await run(page, user.username, user.ip, user.agent);
    console.log('Slow owner simulation completed.');
  } catch (error) {
    console.error('Failed during slow owner simulation:', error);
  } finally {
    await page.close();
    await browser.close();
  }
}

// Executa uma única vez
safeRun().catch(err => {
  console.error('Fatal error in single_slow_owner:', err);
  process.exit(1);
});