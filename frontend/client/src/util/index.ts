import { IHttpMethod } from '../types/index';
export const url = (path: string): string => `/${path}`;
import { APMService } from '../main';

/**
 * Helpers internos
 */
const captureApmError = (method: string, requestUrl: string, status: number, statusText: string) => {
  APMService.getInstance().captureError(`Failed ${method} ${requestUrl} - ${status} ${statusText}`);
};

const safeJson = async <T = any>(response: Response): Promise<T | {}> => {
  if (response.status === 204) return {};
  try {
    return (await response.json()) as T;
  } catch {
    return {};
  }
};

/**
 * GET via XHR com callback
 * (mantido por compatibilidade e por comentário original sobre instrumentação do APM)
 */
export const xhr_request = (path: string, onSuccess: (status: number, response: any) => any) => {
  const requestUrl = url(path);
  const xhr = new XMLHttpRequest();
  xhr.open('GET', requestUrl, true);
  xhr.onload = function () {
    if (xhr.status < 400) {
      try {
        onSuccess(xhr.status, JSON.parse(xhr.responseText));
      } catch {
        onSuccess(xhr.status, {});
      }
    } else {
      captureApmError('GET', requestUrl, xhr.status, xhr.statusText);
      onSuccess(xhr.status, {});
    }
  };
  xhr.onerror = function () {
    captureApmError('GET', requestUrl, xhr.status, xhr.statusText);
    onSuccess(xhr.status, {});
  };
  xhr.send(null);
};

/**
 * GET via fetch com callback
 */
export const request = async <T = any>(
  path: string,
  onSuccess: (status: number, response: T | {}) => any
): Promise<void> => {
  const requestUrl = url(path);
  const response = await fetch(requestUrl);
  if (response.status < 400) {
    onSuccess(response.status, await safeJson<T>(response));
  } else {
    captureApmError('GET', requestUrl, response.status, response.statusText);
    onSuccess(response.status, {});
  }
};

/**
 * fetch com Promise e método customizável
 */
export const request_promise = async <T = any>(
  path: string,
  method: IHttpMethod = 'GET',
  data?: any
): Promise<T | {}> => {
  const requestUrl = url(path);
  const init: RequestInit = {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
  };
  if (data) init.body = JSON.stringify(data);

  const response = await fetch(requestUrl, init);
  if (response.status < 400) {
    return safeJson<T>(response);
  } else {
    captureApmError(method, requestUrl, response.status, response.statusText);
    return {};
  }
};

/**
 * XHR com Promise (mantido por compatibilidade)
 */
export const xhr_request_promise = <T = any>(
  path: string,
  method: IHttpMethod = 'GET',
  data?: any
): Promise<T> => {
  return new Promise(function (resolve, reject) {
    const requestUrl = url(path);
    const xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.onload = function () {
      if (xhr.status < 400) {
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch {
          // @ts-expect-error manter compatibilidade com chamadores que esperam objeto
          resolve({});
        }
      } else {
        captureApmError(method, requestUrl, xhr.status, xhr.statusText);
        reject({});
      }
    };
    xhr.onerror = function () {
      captureApmError(method, requestUrl, xhr.status, xhr.statusText);
      reject({});
    };

    xhr.send(data ? JSON.stringify(data) : null);
  });
};

/**
 * submitForm com callback (mantido)
 */
export const submitForm = (
  method: IHttpMethod,
  path: string,
  data: any,
  onSuccess: (status: number, response: any) => void
) => {
  const requestUrl = url(path);

  const fetchParams: RequestInit = {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  };

  return fetch(requestUrl, fetchParams).then(async (response) => {
    if (response.status >= 400) {
      captureApmError(method, requestUrl, response.status, response.statusText);
      onSuccess(response.status, `Failed ${method} ${requestUrl} - ${response.status} ${response.statusText}`);
    } else {
      const payload = await safeJson(response);
      onSuccess(response.status, payload);
    }
  });
};

/**
 * submitForm via XHR com callback (mantido)
 */
export const xhr_submitForm = (
  method: IHttpMethod,
  path: string,
  data: any,
  onSuccess: (status: number, response: any) => void
) => {
  const requestUrl = url(path);
  const xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'application/json');

  xhr.onload = function () {
    if (xhr.status >= 400) {
      captureApmError(method, requestUrl, xhr.status, xhr.statusText);
      const errors = xhr.getResponseHeader('errors');
      if (errors) {
        try {
          onSuccess(xhr.status, JSON.parse(errors));
          return;
        } catch {
          // segue abaixo para tentar responseText
        }
      }
      try {
        onSuccess(xhr.status, JSON.parse(xhr.responseText));
      } catch {
        onSuccess(xhr.status, {});
      }
    } else {
      if (xhr.status !== 204) {
        try {
          onSuccess(xhr.status, JSON.parse(xhr.responseText));
        } catch {
          onSuccess(xhr.status, {});
        }
      } else {
        onSuccess(xhr.status, {});
      }
    }
  };

  xhr.onerror = function () {
    captureApmError('GET', requestUrl, xhr.status, xhr.statusText);
    onSuccess(xhr.status, {});
  };

  xhr.send(JSON.stringify(data));
};
