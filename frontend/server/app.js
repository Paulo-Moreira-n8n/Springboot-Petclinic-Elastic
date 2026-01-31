// app.js
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const helmet = require('helmet');
const index = require('./routes/index');
const configRoute = require('./routes/config');
const settings = require('./config');
const apm = require('elastic-apm-node');
const proxy = require('express-http-proxy');
const app = express();

// Respeitar cabeçalhos x-forwarded-* quando atrás de proxy/reverso
app.set('trust proxy', true); // Express recomenda ajustar quando há proxy. [16](https://expressjs.com/en/guide/behind-proxies.html)

// Favicon antecipado (evita poluir logs com /favicon.ico)
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.png'))); // [10](https://www.npmjs.com/package/serve-favicon)

// Segurança e performance
app.use(helmet()); // Helmet v8 (Node 18+) [8](https://github.com/helmetjs/helmet/blob/main/CHANGELOG.md)
app.use(compression());

// Logs
app.use(logger('dev'));

// Parsers nativos (substitui body-parser) [6](https://codeforgeek.com/body-parser-deprecated/)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cookies
app.use(cookieParser());

// Conteúdo estático
app.use(express.static(path.join(__dirname, 'public')));

// Rotas básicas
app.use('/', index);
app.use('/healthcheck', index);
app.use('/config', configRoute);

// Utilidades APM/proxy
function getError(resp, proxyResData) {
  if (resp.headers.errors) {
    try {
      const data = JSON.parse(resp.headers.errors);
      let msg = '';
      if (Array.isArray(data)) {
        data.forEach((error, idx) => {
          if (idx > 0) msg += ' - ';
          if (error.errorMessage) msg += error.errorMessage;
          if (error.fieldName) {
            msg += ' - ' + error.fieldName;
            if (error.fieldValue) msg += ': ' + error.fieldValue;
          }
        });
      } else {
        msg = data;
      }
      const err = new Error(msg);
      err.name = msg;
      return err;
    } catch (e) {
      console.log('Unable to parse Error');
    }
  } else if (proxyResData) {
    try {
      const data = JSON.parse(proxyResData.toString('utf8'));
      let msg = data;
      if (data.exMessage) msg = data.exMessage;
      else if (data.className) msg = data.className;
      else if (data.message) msg = data.message;
      const err = new Error(msg);
      err.name = msg;
      return err;
    } catch (e) {
      console.log('Unable to parse Error');
    }
  }
  const err = Error('Unknown - ' + resp.statusCode);
  err.name = 'Unknown - ' + resp.statusCode;
  return err;
}

function getUserDetails(req) {
  const headers = {};
  for (const header in req.headers) {
    headers[header.toLowerCase()] = req.headers[header];
  }
  const username = headers['x-forwarded-user'] ? headers['x-forwarded-user'] : 'N/A';
  const email = headers['x-forwarded-email'] ? headers['x-forwarded-email'] : 'N/A';
  return [username, email];
}

function captureErrorBody(proxyResData) {
  try {
    return JSON.parse(proxyResData.toString('utf8'));
  } catch (e) {
    return {};
  }
}

// Proxies auxiliares de endereço
app.use('/api/find_state', proxy(settings.address_server, {
  preserveHostHdr: true,
  proxyReqPathResolver: () => {
    apm.setTransactionName('/api/find_state');
    const [username, email] = getUserDetails(app.request);
    apm.setUserContext({ username, email });
    return '/api/find_state';
  },
  userResDecorator: (proxyRes, proxyResData, userReq) => {
    if (proxyRes.statusCode >= 400) {
      const err = getError(proxyRes, proxyResData);
      apm.captureError(err, {
        request: userReq,
        response: proxyRes,
        custom: captureErrorBody(proxyResData)
      });
    }
    return proxyResData;
  }
}));

app.use('/api/find_city', proxy(settings.address_server, {
  preserveHostHdr: true,
  proxyReqPathResolver: () => {
    apm.setTransactionName('/api/find_city');
    const [username, email] = getUserDetails(app.request);
    apm.setUserContext({ username, email });
    return '/api/find_city';
  },
  userResDecorator: (proxyRes, proxyResData, userReq) => {
    if (proxyRes.statusCode >= 400) {
      const err = getError(proxyRes, proxyResData);
      apm.captureError(err, {
        request: userReq,
        response: proxyRes,
        custom: captureErrorBody(proxyResData)
      });
    }
    return proxyResData;
  }
}));

app.use('/api/find_address', proxy(settings.address_server, {
  preserveHostHdr: true,
  proxyReqPathResolver: () => {
    apm.setTransactionName('/api/find_address');
    const [username, email] = getUserDetails(app.request);
    apm.setUserContext({ username, email });
    return '/api/find_address';
  },
  userResDecorator: (proxyRes, proxyResData, userReq) => {
    if (proxyRes.statusCode >= 400) {
      const err = getError(proxyRes, proxyResData);
      apm.captureError(err, {
        request: userReq,
        response: proxyRes,
        custom: captureErrorBody(proxyResData)
      });
    }
    return proxyResData;
  }
}));

// Proxy geral para /api -> API backend com prefixo
app.use('/api', proxy(settings.api_server, {
  preserveHostHdr: true,
  proxyReqPathResolver: (req) => {
    apm.setTransactionName('/api/' + req.url.split('/').filter(Boolean)[0]);
    const [username, email] = getUserDetails(req);
    apm.setUserContext({ username, email });
    return settings.api_prefix + req.url;
  },
  userResDecorator: (proxyRes, proxyResData, userReq) => {
    if (proxyRes.statusCode >= 400) {
      const err = getError(proxyRes, proxyResData);
      apm.captureError(err, {
        request: userReq,
        response: proxyRes,
        custom: captureErrorBody(proxyResData)
      });
    }
    return proxyResData;
  }
}));

// SPA fallback: entrega index.html do /public
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

// 404
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handler
app.use(function (err, req, res, next) {
  if (err.name === 'JsonSchemaValidation') {
    res.status(422);
    res.json({
      statusText: 'Bad Request',
      jsonSchemaValidation: true,
      validations: err.validations
    });
  } else {
    res.status(err.status || 500).json({
      message: err.message,
      error: req.app.get('env') === 'development' ? err : {}
    });
  }
});

module.exports = app;
