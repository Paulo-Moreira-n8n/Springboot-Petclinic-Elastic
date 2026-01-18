
// server/routes/diag.js
const express = require('express');
const router = express.Router();

async function ping(url, opts = {}) {
  try {
    const r = await fetch(url, opts);
    return { ok: r.ok, status: r.status, url };
  } catch (e) {
    return { ok: false, error: String(e), url };
  }
}

router.get('/', async (req, res) => {
  if (process.env.ENABLE_DIAG !== '1') return res.status(404).end();
  const out = {
    now: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      SERVICE: process.env.ELASTIC_APM_SERVICE_NAME,
      VERSION: process.env.ELASTIC_APM_SERVICE_VERSION
    },
    checks: {}
  };
  out.checks.apm = await ping(`${process.env.ELASTIC_APM_SERVER_URL}/healthcheck`);
  const auth = Buffer.from(`${process.env.ELASTICSEARCH_USERNAME}:${process.env.ELASTICSEARCH_PASSWORD}`).toString('base64');
  out.checks.elasticsearch = await ping(`${process.env.ELASTICSEARCH_URL}/_cat/health`, {
    headers: { Authorization: `Basic ${auth}` }
  });
  res.json(out);
});

module.exports = router;
