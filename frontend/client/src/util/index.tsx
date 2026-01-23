import { IHttpMethod } from '../types/index';
export const url = (path: string): string => `/${path}`;
import { APMService } from '../main';

// as fetch isn't instrumenented yet by elastic APM
export const xhr_request = (path: string, onSuccess: (status: number, response: any) => any) => {
  const requestUrl = url(path);
  const xhr = new XMLHttpRequest();
  xhr.open('GET', requestUrl, true);
  xhr.onload = function(e) {
    if (xhr.status < 400) {
        onSuccess(xhr.status, JSON.parse(xhr.responseText));
    } else {
      APMService.getInstance().captureError(`Failed GET on ${requestUrl} - ${xhr.status} ${xhr.statusText}`);
      onSuccess(xhr.status, {});
    }
  };
  xhr.onerror = function(e) {
     APMService.getInstance().captureError(`Failed GET on ${requestUrl} - ${xhr.status} ${xhr.statusText}`);
     onSuccess(xhr.status, {});
  };
  xhr.send(null);
};

export const request = (path: string, onSuccess: (status: number, response: any) => any) => {
  const requestUrl = url(path);
  return fetch(requestUrl)
    .then(response =>  {
        if (response.status < 400) {
            response.json().then(result => {
                onSuccess(response.status, result);
            });
        } else {
          APMService.getInstance().captureError(`Failed GET on ${requestUrl} - ${response.status} ${response.statusText}`);
          onSuccess(response.status, {});
        }
    });
};

export const request_promise = (path: string, method = 'GET', data?: any): any => {
  const requestUrl = url(path);
  let fetchParams = {
    method: method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };
  if (data) {
    fetchParams['body'] = JSON.stringify(data);
  }
  return fetch(requestUrl, fetchParams)
    .then(response =>  {
        if (response.status < 400) {
            return response.json();
        } else {
          APMService.getInstance().captureError(`Failed GET on ${requestUrl} - ${response.status} ${response.statusText}`);
          return {};
        }
    });
};

// as fetch isn't instrumenented yet by elastic APM
export const xhr_request_promise = (path: string, method = 'GET', data?: any): any => {
  return new Promise(function (resolve, reject) {
    const requestUrl = url(path);
    const xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onload = function(e) {
      if (xhr.status < 400) {
          resolve(JSON.parse(xhr.responseText));
      } else {
          APMService.getInstance().captureError(`Failed GET on ${requestUrl} - ${xhr.status} ${xhr.statusText}`);
          reject({});
      }
    };
    xhr.onerror = function(e) {
      APMService.getInstance().captureError(`Failed GET on ${requestUrl} - ${xhr.status} ${xhr.statusText}`);
      reject({});
    };
    let payload = null;
    if (data) {
      payload = JSON.stringify(data);
    }
    xhr.send(payload);
  });
};

/**
 * path: relative PATH without host and port (i.e. '/api/123')
 * data: object that will be passed as request body
 * onSuccess: callback handler if request succeeded. Succeeded means it could technically be handled (i.e. valid json is returned)
 * regardless of the HTTP status code.
 */
export const submitForm = (method: IHttpMethod, path: string, data: any, onSuccess: (status: number, response: any) => void) => {
  const requestUrl = url(path);

  const fetchParams = {
    method: method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
  return fetch(requestUrl, fetchParams)
    .then(response =>  {
        if (response.status >= 400) {
            APMService.getInstance().captureError(`Failed ${method} to ${requestUrl} - ${response.status} ${response.statusText}`);
            onSuccess(response.status, `Failed ${method} to ${requestUrl} - ${response.status} ${response.statusText}`);
        } else {
          if (response.status !== 204)  {
            response.json().then(result => {
                onSuccess(response.status, result);
            });
          } else {
            onSuccess(response.status, {});
          }
        }
    });
};
// as fetch isn't instrumenented yet by elastic APM
export const xhr_submitForm = (method: IHttpMethod, path: string, data: any, onSuccess: (status: number, response: any) => void) => {
  const requestUrl = url(path);
  const xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.onload = function(e) {
    if (xhr.status >= 400) {
        APMService.getInstance().captureError(`Failed ${method} to ${requestUrl} - ${xhr.status} ${xhr.statusText}`);
        let errors = xhr.getResponseHeader('errors');
        if (errors) {
          onSuccess(xhr.status, JSON.parse(errors));
        } else {
          onSuccess(xhr.status, JSON.parse(xhr.responseText));
        }
    } else {
      if (xhr.status !== 204)  {
        onSuccess(xhr.status, JSON.parse(xhr.responseText));
      } else {
        onSuccess(xhr.status, {});
      }
    }
  };

  xhr.onerror = function(e) {
     APMService.getInstance().captureError(`Failed GET on ${requestUrl} - ${xhr.status} ${xhr.statusText}`);
     onSuccess(xhr.status, {});
  };
  xhr.send(JSON.stringify(data));
};
