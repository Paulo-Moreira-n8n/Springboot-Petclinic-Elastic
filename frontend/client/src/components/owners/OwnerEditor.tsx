
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { url, xhr_submitForm, xhr_request_promise } from '../../util/index';
import Input from '../form/Input';
import SelectInput from '../form/SelectInput';
import AutocompleteInput from '../form/AutocompleteInput';
import { APMService, punish } from '../../main';
import { Digits, NotEmpty } from '../form/Constraints';
import { IInputChangeHandler, IFieldError, IError, IOwner, ISelectOption } from '../../types/index';

interface IOwnerEditorProps {
  initialOwner?: IOwner;
}

const OwnerEditor: React.FC<IOwnerEditorProps> = ({ initialOwner }) => {
  const navigate = useNavigate();

  const initialRender = useRef(true);
  const lastUsedZip = useRef<string | null>(null);

  const [owner, setOwner] = useState<IOwner>(() => Object.assign({}, initialOwner));
  const [error, setError] = useState<IError | undefined>(undefined);
  const [states, setStates] = useState<ISelectOption[]>([{ value: '', name: '' }]);
  const [cities, setCities] = useState<ISelectOption[]>([{ value: '', name: '' }]);
  const [addresses, setAddresses] = useState<ISelectOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    APMService.getInstance().startTransaction('OwnerEditor');
    punish();

    const bootstrap = async () => {
      if (owner?.zipCode && owner.zipCode !== '') {
        try {
          const [st, ct] = await Promise.all([
            xhr_request_promise('api/find_state', 'POST', { zip_code: owner.zipCode }),
            xhr_request_promise('api/find_city', 'POST', { zip_code: owner.zipCode, state: owner.state })
          ]);
          APMService.getInstance().startSpan('Page Render', 'react');

          const statesList = st?.states ? st.states.map((s: string) => ({ value: s, name: s })) : [];
          statesList.unshift({ value: '', name: '' });
          const citiesList = ct?.cities ? ct.cities.map((c: string) => ({ value: c, name: c })) : [];
          citiesList.unshift({ value: '', name: '' });

          setStates(statesList);
          setCities(citiesList);
        } catch {
          // falha silenciosa (mantemos comportamento original)
        }
      } else {
        APMService.getInstance().startSpan('Page Render', 'react');
        setStates([{ value: '', name: '' }]);
        setCities([{ value: '', name: '' }]);
      }
    };

    bootstrap();

    return () => {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialRender.current) {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(true);
      initialRender.current = false;
    }
  }, [states, cities]);

  const onSubmit = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const postUrl = owner.isNew ? 'api/owners' : 'api/owners/' + owner.id;

    setError({ fieldErrors: {} as any });
    setLoading(true);

    APMService.getInstance().startTransaction(owner.isNew ? 'CreateOwner' : 'UpdateOwner');

    xhr_submitForm(owner.isNew ? 'POST' : 'PUT', postUrl, owner, (status, response) => {
      if (status === 204 || status === 201) {
        APMService.getInstance().endTransaction(true);
        const owner_id = owner.isNew ? (response as IOwner).id : owner.id;
        navigate(`/owners/${owner_id}`);
      } else {
        APMService.getInstance().endTransaction(false);
        const fieldErrors = (response as any[]).reduce((map, err) => {
          map[err.fieldName] = { field: err.fieldName, message: err.errorMessage };
          return map;
        }, {} as Record<string, IFieldError>);
        setError({ fieldErrors });
        setLoading(false);
      }
    });
  }, [navigate, owner]);

  const onInputChange: IInputChangeHandler = useCallback((name, value, fieldError) => {
    setOwner((prev) => Object.assign({}, prev, { [name]: value }));
    setError((prev) => {
      const newFieldErrors = prev ? Object.assign({}, prev.fieldErrors, { [name]: fieldError }) : { [name]: fieldError };
      return { fieldErrors: newFieldErrors };
    });
  }, []);

  const xhr_address_service_fetch = useCallback((requestUrl: string, body: any, onSuccess: (data: any) => void) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', requestUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      if (xhr.status === 200) {
        onSuccess(JSON.parse(xhr.responseText));
      } else {
        APMService.getInstance().captureError(`Failed GET on ${requestUrl} - ${xhr.status} ${xhr.statusText}`);
        onSuccess(null);
      }
    };
    xhr.onerror = function () {
      APMService.getInstance().captureError(`Failed GET on ${requestUrl} - ${xhr.status} ${xhr.statusText}`);
      onSuccess(null);
    };
    xhr.send(JSON.stringify(body || null));
  }, []);

  const onZipChange = useCallback((name: string, value: string) => {
    if (value.trim() !== '' && lastUsedZip.current !== value) {
      APMService.getInstance().startTransaction('OwnerEditor:ZipChange');
      const requestUrl = url('api/find_state');

      xhr_address_service_fetch(requestUrl, { zip_code: value }, (data) => {
        if (data) {
          const statesList = data.states ? data.states.map((s: string) => ({ value: s, name: s })) : [];
          const modifiedOwner = Object.assign({}, owner, { [name]: value, ['state']: '', ['city']: '' });
          statesList.unshift({ value: '', name: '' });

          APMService.getInstance().endTransaction(true);
          lastUsedZip.current = value;

          setOwner(modifiedOwner);
          setStates(statesList);
          setCities([{ value: '', name: '' }]);
        } else {
          APMService.getInstance().endTransaction(false);
        }
      });
    }
  }, [owner, xhr_address_service_fetch]);

  const onStateChange = useCallback((name: string, value: string) => {
    APMService.getInstance().startTransaction('OwnerEditor:StateChange');

    const requestUrl = url('api/find_city');
    const modifiedOwner = Object.assign({}, owner, { [name]: value, ['city']: '' });
    setOwner(modifiedOwner);

    xhr_address_service_fetch(requestUrl, { zip_code: owner.zipCode, state: value }, (data) => {
      if (data) {
        const citiesList = data.cities ? data.cities.map((c: string) => ({ value: c, name: c })) : [];
        citiesList.unshift({ value: '', name: '' });

        APMService.getInstance().endTransaction(true);
        setCities(citiesList);
      } else {
        APMService.getInstance().endTransaction(false);
      }
    });
  }, [owner, xhr_address_service_fetch]);

  const onCityChange = useCallback((name: string, value: string) => {
    setOwner((prev) => Object.assign({}, prev, { [name]: value }));
  }, []);

  const onAddressFetch = useCallback((value: string, onSuccess: (data: any) => void) => {
    if (value.length > 3 && /\s/.test(value) && value !== owner.address) {
      APMService.getInstance().startTransaction('OwnerEditor:FindAddress');
      const requestUrl = url('api/find_address');

      xhr_address_service_fetch(
        requestUrl,
        { zip_code: owner.zipCode, state: owner.state, city: owner.city, address: owner.address },
        (data) => {
          if (data) {
            onSuccess(data.addresses);
            APMService.getInstance().endTransaction(true);
          } else {
            APMService.getInstance().endTransaction(false);
          }
        }
      );
    }
  }, [owner, xhr_address_service_fetch]);

  const onAddressChange = useCallback((value: string) => {
    setOwner((prev) => Object.assign({}, prev, { ['address']: value }));
  }, []);

  return (
    <span id="owner_editor">
      <div className="loader" style={!loading ? { display: 'none' } : {}}></div>
      <h2>{owner.isNew ? 'Add Owner' : 'Update Owner'}</h2>
      <form className="form-horizontal" method="POST" action={url(owner.isNew ? 'api/owners' : 'api/owners/' + owner.id)}>
        <div className="form-group has-feedback">
          <Input object={owner} error={error as IError} constraint={NotEmpty} label="First Name" name="firstName" onChange={onInputChange} disabled={loading} />
          <Input object={owner} error={error as IError} constraint={NotEmpty} label="Last Name" name="lastName" onChange={onInputChange} disabled={loading} />
          <Input object={owner} error={error as IError} constraint={NotEmpty} label="Zip Code" name="zipCode" onChange={onInputChange} onBlur={onZipChange} disabled={loading} />
          <SelectInput object={owner} error={error} size={1} label="State" name="state" options={states} onChange={onStateChange} disabled={loading || states.length === 1} />
          <SelectInput object={owner} error={error} size={1} label="City" name="city" options={cities} onChange={onCityChange} disabled={loading || cities.length === 1} />
          <AutocompleteInput value={owner.address} label="Address" name="address" onFetch={onAddressFetch} onChange={onAddressChange} disabled={loading} />
          <Input object={owner} error={error as IError} constraint={Digits(10)} label="Telephone" name="telephone" onChange={onInputChange} disabled={loading} />
        </div>
        <div className="form-group">
          <div className="col-sm-offset-2 col-sm-10">
            <button className="btn btn-default" type="submit" onClick={onSubmit}>
              {owner.isNew ? 'Add Owner' : 'Update Owner'}
            </button>
          </div>
        </div>
      </form>
    </span>
  );
};

export default OwnerEditor;
