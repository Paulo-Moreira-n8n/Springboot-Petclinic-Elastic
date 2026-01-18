// main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
// React Router agora é fornecido pelo Root via RouterProvider
import Root from './Root';

// Estilos (LESS). Vite cuida do pipeline via css.preprocessorOptions.
import './styles/less/petclinic.less';

// APM RUM (ESM): mantemos mesma lógica de inicialização
import { init as initApm } from '@elastic/apm-rum';
import { url } from './util/index';

// Exportando a classe APMService
export class APMService {
  private static instance: APMService;
  private apm: any;
  private current_span: any;
  private span_open = false;
  private ready = false;
  private open = false;

  private constructor() {}

  private async setup_apm() {
    const requestUrl = url('config');
    try {
      const resp = await fetch(requestUrl);
      if (!resp.ok) {
        console.log('Failed to Initialize APM');
        console.log(`Failed GET on ${requestUrl} - ${resp.status} ${resp.statusText}`);
        return;
      }
      const config = await resp.json();
      this.apm = initApm({
        serviceName: config.apm_client_service_name,
        serverUrl: config.apm_server_js,
        serviceVersion: config.apm_service_version,
        transactionThrottleLimit: 1000,
        errorThrottleLimit: 1000,
		logLevel: 'debug', // >>> DEBUG
        distributedTracingOrigins: (config.distributedTracingOrigins || '').split(',')
      });
      this.apm.setInitialPageLoadName(
        window.location.pathname !== '' ? window.location.pathname : 'homepage'
      );
      this.apm.addFilter(function (payload: any) {
        if (payload.transactions) {
          payload.transactions.filter(function (tr: any) {
            return tr.spans.some(function (span: any) {
              return (
                span.context &&
                span.context.http &&
                span.context.http.url &&
                (span.context.http.url.includes('rum/transactions') ||
                 span.context.http.url.includes('rum/events'))
              );
            });
          });
        }
        return payload;
      });
      this.apm.setUserContext({
        username: config.user?.username,
        email: config.user?.email
      });
      this.ready = true;
    } catch (e) {
      console.log('Failed to Initialize APM');
      console.log(e);
    }
  }

  static getInstance() {
    if (!APMService.instance) {
      console.log('Creating APM Service');
      APMService.instance = new APMService();
      APMService.instance.setup_apm();
      console.log('Created APM Service');
    }
    return APMService.instance;
  }

  startTransaction(name: string) {
    if (this.ready && !this.open) {
      console.log('Starting transaction - ' + name + ':');
      if (this.apm.getCurrentTransaction()) {
        this.apm.getCurrentTransaction().end();
      }
      const transaction = this.apm.startTransaction(name, 'Events');
      this.apm.addLabels('success_load', false);
      console.log(transaction);
      this.open = true;
    }
  }

  endTransaction(completed: boolean) {
    if (this.open) {
      this.open = false;
      this.apm.addLabels('success_load', completed.toString());
      console.log('Closing transaction');
      const transaction = this.apm.getCurrentTransaction();
      if (transaction) {
        transaction.end();
        console.log('Closed transaction:');
      }
      console.log(transaction);
    }
  }

  startSpan(name: string, type: string) {
    if (this.ready && this.open) {
      const transaction = this.apm.getCurrentTransaction();
      this.span_open = true;
      this.current_span = transaction.startSpan(name, type);
    }
  }

  endSpan() {
    if (this.open && this.span_open) {
      this.current_span.end();
      this.span_open = false;
    }
  }

  captureError(message: string) {
    if (this.open) {
      console.log('Capturing Error');
      this.apm.captureError(new Error(message));
    }
  }
}

// (Opcional) Inicializar APM aqui, se quiser estar ativo desde o boot:
APMService.getInstance();


// >>> DEBUG: rastrear chamadas fetch no browser
if ((window as any).__DEBUG_HTTP || import.meta.env.MODE !== 'production') {
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as any).url;
    const method = (init?.method || 'GET').toUpperCase();
    const t0 = performance.now();
    try {
      const resp = await origFetch(input, init);
      const dt = (performance.now() - t0).toFixed(1);
      console.log(`[BROWSER] ${method} ${url} -> ${resp.status} (${dt}ms)`);
      return resp;
    } catch (e) {
      const dt = (performance.now() - t0).toFixed(1);
      console.error(`[BROWSER] ${method} ${url} -> ERROR (${dt}ms)`, e);
      throw e;
    }
  };
}
// <<< DEBUG


// Render da aplicação (React 19 + createRoot)
const mountPoint = document.getElementById('mount')!;
createRoot(mountPoint).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

// Legado de IE: mantemos a função se algum componente a usar
export const detectIE = () => {
  const ua = window.navigator.userAgent;
  const msie = ua.indexOf('MSIE ');
  if (msie > 0) return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
  const trident = ua.indexOf('Trident/');
  if (trident > 0) {
    const rv = ua.indexOf('rv:');
    return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
  }
  const edge = ua.indexOf('Edge/');
  if (edge > 0) return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
  return -1;
};

export const pi = (count: number) => {
  let inside = 0;
  for (let i = 0; i < count; i++) {
    const x = Math.random() * 2 - 1;
    const y = Math.random() * 2 - 1;
    if (x * x + y * y < 1) inside++;
  }
  return 4.0 * (inside / count);
};

export const punish = () => {
  if (detectIE() > -1) {
    console.log('Anyone who uses IE deserves to be punished!');
    const pain = 50_000_000 + Math.floor(Math.random() * 25_000_000);
    console.log('Amount of Pain: ' + pain);
    const val = pi(pain);
    console.log(val);
  }
};

// Exportando também a instância singleton para fácil acesso
export const apmServiceInstance = APMService.getInstance();