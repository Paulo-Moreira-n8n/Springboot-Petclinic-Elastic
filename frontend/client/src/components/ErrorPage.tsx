
import React, { useEffect, useState } from 'react';
import { url } from '../util';
import { APMService, punish } from '../main';

interface IErrorPageState {
  status?: string;
  message?: string;
}

const ErrorPage: React.FC = () => {
  const [error, setError] = useState<IErrorPageState | undefined>(undefined);

  useEffect(() => {
    APMService.getInstance().startTransaction('ErrorPage');
    punish();

    const requestUrl = url('api/error');
    fetch(requestUrl)
      .then(async (resp) => {
        const payload = await resp.json().catch(() => ({}));
        if (payload && payload.message) {
          APMService.getInstance().captureError(payload.message);
        }
        APMService.getInstance().endTransaction(true);
        setError(payload);
      })
      .catch((e) => {
        APMService.getInstance().captureError(`Failed GET ${requestUrl} - ${e}`);
        APMService.getInstance().endTransaction(false);
        setError({ status: 'UNKNOWN', message: 'Unexpected error' });
      });

    return () => {
      APMService.getInstance().endTransaction(false);
    };
  }, []);

  return (
    <span>
      <img src="/images/pets.png" />

      <h2>Something happened...</h2>
      {error ? (
        <span>
          <p><b>Status:</b> {error.status}</p>
          <p><b>Message:</b> {error.message}</p>
        </span>
      ) : (
        <p><b>Unknown error</b></p>
      )}
    </span>
  );
};

export default ErrorPage;
