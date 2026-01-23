import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import { browserHistory as history } from 'react-router';

const initApm = require('@elastic/apm-rum/src/index').init;

require('./styles/less/petclinic.less');
import { url } from './util/index';

export class APMService {

  private static instance: APMService;
  private apm: any;
  private current_span: any;
  private span_open = false;
  private ready = false;
  private open = false;
  private constructor () {

  }

  private setup_apm() {
      const requestUrl = url('config');
      const xhr = new XMLHttpRequest();
      xhr.open('GET', requestUrl, true);
      xhr.onload = function(e) {
        if (xhr.status === 200) {
            const config = JSON.parse(xhr.responseText);
            this.apm = initApm({
               serviceName: config.apm_client_service_name,
               serverUrl: config.apm_server_js,
               serviceVersion: config.apm_service_version,
               transactionThrottleLimit: 1000,
               errorThrottleLimit: 1000,
               distributedTracingOrigins: config.distributedTracingOrigins.split(',')
            });
            this.apm.setInitialPageLoadName(window.location.pathname !== '' ? window.location.pathname : 'homepage');
            this.apm.addFilter(function (payload) {
              if (payload.transactions) {
                payload.transactions.filter(function (tr) {
                  return tr.spans.some(function (span) {
                    return (span.context && span.context.http && span.context.http.url && (span.context.http.url.includes('rum/transactions')
                    || span.context.http.url.includes('rum/events')));
                  });
                });
              };
              return payload;
            });
            this.apm.setUserContext({
                'username': config.user.username,
                'email': config.user.email
            });
            APMService.instance.ready = true;
        } else {
          console.log('Failed to Initialize APM');
          console.log(`Failed GET on ${requestUrl} - ${xhr.status} ${xhr.statusText}`);
        }
      }.bind(this);
      xhr.onerror = function(e) {
         console.log('Failed to Initialize APM');
         console.log(`Failed GET on ${requestUrl} - ${xhr.status} ${xhr.statusText}`);
      };
      xhr.send(null);
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


  startTransaction(name) {
    if (APMService.instance.ready && !APMService.instance.open) {
      console.log('Starting transaction - ' + name + ':');
      // in case one has been opened
      if (APMService.instance.apm.getCurrentTransaction()) {
        APMService.instance.apm.getCurrentTransaction().end();
      }
      let transaction = APMService.instance.apm.startTransaction(name, 'Events');
      APMService.instance.apm.addLabels('success_load', false);
      console.log(transaction);
      APMService.instance.open = true;
    }
  }

  endTransaction(completed) {
    if (APMService.instance.open) {
      APMService.instance.open = false;
      APMService.instance.apm.addLabels('success_load', completed.toString());
      console.log('Closing transaction');
      let transaction = APMService.instance.apm.getCurrentTransaction();
      if (transaction) {
        transaction.end();
        console.log('Closed transaction:');
      }
      console.log(transaction);
    }
  }

  startSpan(name, type) {
    if (APMService.instance.ready && APMService.instance.open) {
      let transaction = APMService.instance.apm.getCurrentTransaction();
      APMService.instance.span_open = true;
      APMService.instance.current_span = transaction.startSpan(name, type);
    }
  }

  endSpan() {
    if (APMService.instance.open && APMService.instance.span_open) {
      APMService.instance.current_span.end();
      APMService.instance.span_open = false;
    }
  }

  captureError(message) {
    if (APMService.instance.open) {
      console.log('Capturing Error');
      APMService.instance.apm.captureError(new Error(message));
    }
  }

}

export const detectIE = () => {
    let ua = window.navigator.userAgent;
    let msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }
    let trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        let rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }
    let edge = ua.indexOf('Edge/');
    if (edge > 0) {
       // Edge (IE 12+) => return version number
       return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }
    // other browser
    return -1;
};

export const pi = (count: number) => {
    let inside = 0;
    for (let i = 0; i < count; i++) {
        let x = (Math.random() * 2) - 1;
        let y = (Math.random() * 2) - 1;
        if (((x * x) + (y * y)) < 1) {
            inside++;
        }
    }
    return 4.0 * (inside / count);
};

export const punish = () => {
    if (detectIE() > -1) {
        console.log('Anyone who uses IE deserves to be punished!');
        let pain = 50000000 + Math.floor(Math.random() * 25000000);
        console.log('Amount of Pain: ' + pain);
        let val = pi(pain);
        console.log(val);
    };
};

/**

 **/
// The Application
import Root from './Root';

// Render Application
const mountPoint = document.getElementById('mount');
ReactDOM.render(
  <AppContainer><Root history={history}/></AppContainer>,
  mountPoint
);

declare var module: any;
if (module.hot) {
  module.hot.accept('./Root', () => {
    const NextApp = require('./Root').default;
    ReactDOM.render(
      <AppContainer>
        <NextApp history={history} />
      </AppContainer>,
      mountPoint
    );
  });
}
