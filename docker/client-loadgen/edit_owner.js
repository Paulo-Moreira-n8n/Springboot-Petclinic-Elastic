// edit_owner.js
// Robust owner edit worker (Puppeteer)
// - waits for React/SPA rendering
// - avoids flakiness when zipCode input isn't ready
// - optionally discovers real owner edit links to avoid invalid IDs
// - captures diagnostics on failure

'use strict';

const puppeteer = require('puppeteer');
const csv = require('csvtojson');
const fs = require('fs');
const path = require('path');

const usersFile = './users.csv';
const zipCodeFile = './zip_codes.csv';

// Configuração
const baseUrl = process.env.PETCLINIC_BASE_URL || 'http://spring-petclinic-client:3000';
const ownersListUrl = `${baseUrl}/owners/list`;

// IDs fixos (fallback). Se você preferir sempre usar lista real, deixe empty e use discovery.
const fallbackOwnerIds = Array.from({ length: 10 }, (_, i) => i + 1); // [1..10]

// Diretório de diagnósticos (dentro do container)
const DIAG_DIR = process.env.DIAG_DIR || '/home/chrome/diag';

// ----- Utils -----
function ensureDiagDir() {
  try {
    fs.mkdirSync(DIAG_DIR, { recursive: true });
  } catch (_) {
    // ignore
  }
}

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

// Gera zip code lento ou inválido (5% das vezes)
function maybeMutateZip(zipCode) {
  let finalZipCode = zipCode;

  const slowZipChance = Math.random();
  if (slowZipChance < 0.05) {
    console.log('Using error zip code');

    if (slowZipChance < 0.01) {
      console.log('Using extremely slow zip code');
      const chars = '0123456789';
      let zip = '';

      const len1 = 29 + Math.floor(Math.random() * 10);
      for (let i = 0; i < len1; i++) zip += chars[Math.floor(Math.random() * chars.length)];
      zip += '-';

      const len2 = 29 + Math.floor(Math.random() * 10);
      for (let i = 0; i < len2; i++) zip += chars[Math.floor(Math.random() * chars.length)];

      const letters = 'abcdefghijklmnopqrstuvwxyz';
      zip += letters[Math.floor(Math.random() * letters.length)];

      finalZipCode = zip;
    } else {
      finalZipCode += Math.random().toString(36).substring(Math.floor(Math.random() * 10));
    }
  }

  return finalZipCode;
}

async function captureDiagnostics(page, tag) {
  ensureDiagDir();

  const safeTag = String(tag || 'unknown').replace(/[^\w.-]+/g, '_');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const shotPath = path.join(DIAG_DIR, `fail-${safeTag}-${ts}.png`);
  const htmlPath = path.join(DIAG_DIR, `fail-${safeTag}-${ts}.html`);

  try {
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log('Saved screenshot:', shotPath);
  } catch (e) {
    console.log('Could not save screenshot:', e.message);
  }

  try {
    const html = await page.content();
    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log('Saved HTML:', htmlPath);
  } catch (e) {
    console.log('Could not save HTML:', e.message);
  }
}

// Descobre links reais de edição /owners/{id}/edit para evitar IDs inexistentes
async function fetchEditLinks(page) {
  // vai para lista de owners e extrai links de edição
  await page.goto(ownersListUrl, { waitUntil: 'networkidle2', timeout: 60000 });

  // espera algum link aparecer (ajuste se necessário)
  await page.waitForSelector('a[href^="/owners/"]', { timeout: 30000 });

  const links = await page.$$eval('a[href]', (as) =>
    as
      .map(a => a.getAttribute('href'))
      .filter(Boolean)
      .filter(href => /^\/owners\/\d+\/edit$/.test(href))
  );

  // normaliza para URL absoluta
  const abs = links.map(href => new URL(href, window.location.origin).toString());

  // Em algumas UIs, o link pode ser relativo diferente (ex: /owners/3/edit?x=1)
  // Vamos tentar uma extração mais tolerante:
  if (!abs.length) {
    const tolerant = await page.$$eval('a[href]', (as) =>
      as
        .map(a => a.href)
        .filter(Boolean)
        .filter(href => /\/owners\/\d+\/edit/.test(href))
    );
    return Array.from(new Set(tolerant));
  }

  return Array.from(new Set(abs));
}

// fallback: gera URL de edit com IDs conhecidos
function randomFallbackEditUrl() {
  const userId = fallbackOwnerIds[Math.floor(Math.random() * fallbackOwnerIds.length)];
  return `${baseUrl}/owners/${userId}/edit`;
}

// Seleciona um link de edição (prefere discovery; cai pro fallback se não achar)
async function pickEditUrl(page, cachedLinks) {
  // se já temos cache, usa
  if (cachedLinks && cachedLinks.length > 0) {
    return cachedLinks[Math.floor(Math.random() * cachedLinks.length)];
  }

  // tenta discovery na lista
  try {
    const links = await fetchEditLinks(page);
    if (links && links.length > 0) return links[Math.floor(Math.random() * links.length)];
  } catch (e) {
    console.log('Could not fetch edit links from list, using fallback IDs:', e.message);
  }

  // fallback
  return randomFallbackEditUrl();
}

// Preenche campo com robustez
async function typeInto(page, selector, value) {
  await page.waitForSelector(selector, { visible: true, timeout: 30000 });
  await page.click(selector, { clickCount: 3 });
  // limpa (para inputs que não respeitam clickCount)
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.value = '';
  }, selector);

  await page.type(selector, value, { delay: 0 });
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

  // Aguarda o form estar pronto (React/SPA)
  // Isso é o que elimina o "No element found"
  await page.waitForSelector('input[name="zipCode"]', { visible: true, timeout: 30000 });

  const finalZipCode = maybeMutateZip(zipCode);
  console.log('Zip code:', finalZipCode);

  // Preenche zip code
  await typeInto(page, 'input[name="zipCode"]', finalZipCode);

  // dispara blur (como você já fazia)
  await page.evaluate(() => {
    document
      .querySelector('input[name="zipCode"]')
      ?.dispatchEvent(new Event('blur', { bubbles: true }));
  });

  await sleep(randomDelay());

  // Seleciona estado aleatório (se existir)
  try {
    await page.waitForSelector('select[name="state"]', { timeout: 10000 });
    const stateCount = await page.$$eval('select[name="state"] option', opts => opts.length);
    if (stateCount > 1) {
      const randomStateIndex = 1 + Math.floor(Math.random() * (stateCount - 1)); // evita 0
      // OBS: page.select usa value, não índice; seu app pode ter values numéricos.
      // Se não tiver, você precisará selecionar por value real.
      await page.select('select[name="state"]', String(randomStateIndex));
      await page.evaluate(() => {
        document
          .querySelector('select[name="state"]')
          ?.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  } catch (e) {
    // estado pode não existir dependendo do form — ok
  }

  await sleep(randomDelay());

  // Seleciona cidade aleatória (se existir)
  try {
    await page.waitForSelector('select[name="city"]', { timeout: 10000 });
    const cityCount = await page.$$eval('select[name="city"] option', opts => opts.length);
    if (cityCount > 1) {
      const randomCityIndex = 1 + Math.floor(Math.random() * (cityCount - 1));
      await page.select('select[name="city"]', String(randomCityIndex));
      await page.evaluate(() => {
        document
          .querySelector('select[name="city"]')
          ?.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  } catch (e) {
    // cidade pode não existir dependendo do form — ok
  }

  await sleep(randomDelay());

  // Simula interação com React Autosuggest (se existir)
  try {
    // nem sempre há "select[name=address]" — seu código original tinha isso.
    // vamos só focar no autosuggest input se existir.
    await page.evaluate(() => {
      const input = document.querySelector('.react-autosuggest__input');
      if (input) input.focus();
    });
    await sleep(500);

    const suggestions = await page.$$('.react-autosuggest__suggestion');
    if (suggestions.length > 0) {
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      await randomSuggestion.click();
    }
  } catch (e) {
    // autosuggest pode não existir — ok
  }

  await sleep(randomDelay());

  // Clica no botão submit
  const submitButtons = await page.$$('button[type="submit"]');
  if (submitButtons.length > 0) {
    await submitButtons[0].click();
  }

  // Aguarda possível navegação após submit
  try {
    await page.waitForNavigation({ timeout: 10000, waitUntil: 'networkidle2' });
  } catch (e) {
    // OK se não houver redirecionamento
  }
}

// Loop principal
async function safeRun() {
  ensureDiagDir();

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
      // '--single-process'  // opcional: pode piorar estabilidade; deixe se você precisa.
      '--no-zygote'
    ]
  });

  // Cache de edit links (opcional). Renovamos periodicamente.
  let cachedEditLinks = [];
  let lastRefresh = 0;
  const refreshMs = 5 * 60 * 1000; // 5 min

  for (;;) {
    const user = users[Math.floor(Math.random() * users.length)];
    const zipEntry = zipCodes[Math.floor(Math.random() * zipCodes.length)];
    const zipCode = zipEntry.zip_code;

    const page = await browser.newPage();

    try {
      // Atualiza cache de links periodicamente
      const now = Date.now();
      if (!cachedEditLinks.length || (now - lastRefresh) > refreshMs) {
        try {
          cachedEditLinks = await fetchEditLinks(page);
          lastRefresh = now;
          console.log(`Discovered ${cachedEditLinks.length} real edit links from /owners/list`);
        } catch (e) {
          console.log('Discovery failed, will use fallback IDs. Reason:', e.message);
          cachedEditLinks = [];
        }
      }

      // Seleciona URL de edit (real, preferencialmente)
      const editUrl = await pickEditUrl(page, cachedEditLinks);
      console.log('Handling', editUrl);

      await page.goto(editUrl, { waitUntil: 'networkidle2', timeout: 60000 });

      // garante que não redirecionou
      const landed = page.url();
      if (!landed.includes('/owners/') || !landed.includes('/edit')) {
        throw new Error(`Unexpected redirect: landed on ${landed}`);
      }

      await run(page, user.username, user.ip, user.agent, zipCode);
    } catch (error) {
      console.error('Failed for URL:', page.url(), error.message);
      await captureDiagnostics(page, 'edit_owner');
    } finally {
      await page.close();
    }

    // Delay entre iterações (60–70s)
    await sleep(60000 + Math.floor(Math.random() * 10000));
  }
}

// Tratamento de erros
safeRun().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});