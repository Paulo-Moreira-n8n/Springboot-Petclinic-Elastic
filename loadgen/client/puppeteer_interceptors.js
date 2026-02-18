// loadgen/client/puppeteer_interceptors.js
const { URL } = require('url');
const APM_BASE = process.env.ELASTIC_APM_SERVER_URL || 'http://apm-server:8200';
const APP_BASE = process.env.PETCLINIC_BASE_URL || 'http://spring-petclinic-client:3000';

function getOrigin(u) { try { return new URL(u).origin; } catch { return ''; } }

async function enableSelectiveHeaders(page, xfHeaders = {}) {
  await page.setRequestInterception(true);

  page.on('request', (req) => {
    const url = req.url();
    const origin = getOrigin(url);
    const headers = { ...req.headers() };

    // 1) Nunca deixe X-Forwarded-* irem para o APM (RUM)
    if (url.startsWith(APM_BASE)) {
      delete headers['x-forwarded-for'];
      delete headers['x-forwarded-user'];
      delete headers['x-forwarded-ip'];
      return req.continue({ headers });
    }

    // 2) Só injete X-Forwarded-* para a sua app (mesma origem do front)
    if (origin === getOrigin(APP_BASE)) {
      Object.assign(headers, xfHeaders);
      return req.continue({ headers });
    }

    // 3) Demais destinos: passa limpo
    return req.continue();
  });
}

module.exports = { enableSelectiveHeaders, APM_BASE, APP_BASE };