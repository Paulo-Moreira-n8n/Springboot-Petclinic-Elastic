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
  const [allowManualLocation, setAllowManualLocation] = useState<boolean>(false);

  useEffect(() => {
    APMService.getInstance().startTransaction('OwnerEditor');
    punish();

    const bootstrap = async () => {
      // Derivar sempre states e cities usando zip_code como chave
      if (owner?.zipCode && owner.zipCode !== '') {
        try {
          // 1) STATES por ZIP
          const st = await xhr_request_promise('api/find_state', 'POST', { zip_code: owner.zipCode });
          const statesRaw: string[] = Array.isArray(st?.states) ? st.states : [];
          const statesList: ISelectOption[] = [{ value: '', name: '' }, ...statesRaw.map((s) => ({ value: s, name: s }))];
          setStates(statesList);

          // Seleciona estado automaticamente se houver só um e owner.state estiver vazio
          if ((!owner.state || owner.state.trim() === '') && statesRaw.length === 1) {
            setOwner((prev) => ({ ...prev, state: statesRaw[0] }));
          }

          // 2) CITIES por ZIP (NUNCA enviar state)
          const ct = await xhr_request_promise('api/find_city', 'POST', { zip_code: owner.zipCode });
          const citiesRaw: string[] = Array.isArray(ct?.cities) ? ct.cities : [];

          // Se backend exigir state (erro), habilitar manual e sinalizar erro no CEP
          if (ct && ct.success === false && Array.isArray(ct.message) && ct.message.some((m: string) => /state is required/i.test(m))) {
            setCities([{ value: '', name: '' }]);
            setAllowManualLocation(true);
            setError((prev) => {
              const fieldErrors = Object.assign({}, prev?.fieldErrors);
              fieldErrors['zipCode'] = {
                field: 'zipCode',
                message: 'O serviço de cities ainda exige "state", mas a aplicação usa apenas ZIP. Atualize o serviço para aceitar somente ZIP.'
              } as IFieldError;
              return { fieldErrors };
            });
          } else {
            const citiesList: ISelectOption[] = [{ value: '', name: '' }, ...citiesRaw.map((c) => ({ value: c, name: c }))];
            setCities(citiesList);
            if ((!owner.city || owner.city.trim() === '') && citiesRaw.length === 1) {
              setOwner((prev) => ({ ...prev, city: citiesRaw[0] }));
            }
            setAllowManualLocation(statesRaw.length === 0 || citiesRaw.length === 0);
          }

          APMService.getInstance().startSpan('Page Render', 'react');
        } catch {
          // fallback: limpa listas e habilita manual
          setStates([{ value: '', name: '' }]);
          setCities([{ value: '', name: '' }]);
          setAllowManualLocation(true);
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
    if (loading) return; // evita duplo clique
  
    const postUrl = owner.isNew ? 'api/owners' : 'api/owners/' + owner.id;
  
    setError({ fieldErrors: {} as any });
    setLoading(true);
  
    APMService.getInstance().startTransaction(owner.isNew ? 'CreateOwner' : 'UpdateOwner');
  
    xhr_submitForm(owner.isNew ? 'POST' : 'PUT', postUrl, owner, (status, response) => {
      if (status === 204 || status === 201) {
        APMService.getInstance().endTransaction(true);
        const owner_id = owner.isNew ? (response as IOwner).id : owner.id;
        return navigate(`/owners/${owner_id}`);
      }
  
      // tratamento de erro robusto
      APMService.getInstance().endTransaction(false);
  
      let fieldErrors: Record<string, IFieldError> = {};
      try {
        if (Array.isArray(response)) {
          fieldErrors = (response as any[]).reduce((map, err) => {
            map[err.fieldName] = { field: err.fieldName, message: err.errorMessage };
            return map;
          }, {} as Record<string, IFieldError>);
        } else if (response && typeof response === 'object' && (response as any).fieldErrors) {
          fieldErrors = (response as any).fieldErrors as Record<string, IFieldError>;
        } else if (typeof response === 'string') {
          fieldErrors = { _global: { field: '_global', message: response } as IFieldError };
        } else {
          fieldErrors = { _global: { field: '_global', message: 'Unknown error' } as IFieldError };
        }
      } catch {
        fieldErrors = { _global: { field: '_global', message: 'Unknown error' } as IFieldError };
      }
  
      setError({ fieldErrors });
      setLoading(false);
    });
  }, [navigate, owner, loading]);

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
        APMService.getInstance().captureError(`Failed POST on ${requestUrl} - ${xhr.status} ${xhr.statusText}`);
        onSuccess(null);
      }
    };
    xhr.onerror = function () {
      APMService.getInstance().captureError(`Failed POST on ${requestUrl} - ${xhr.status} ${xhr.statusText}`);
      onSuccess(null);
    };
    xhr.send(JSON.stringify(body || null));
  }, []);

  const onZipChange = useCallback((name: string, value: string) => {
    // sanitiza (mantém apenas dígitos)
    const cleaned = (value ?? '').replace(/\D/g, '').trim();

    // sempre salvar o que o usuário digitou; mas prosseguir apenas se CEP realmente mudou
    if (!cleaned || lastUsedZip.current === cleaned) {
      setOwner(prev => ({ ...prev, [name]: value }));
      return;
    }

    APMService.getInstance().startTransaction('OwnerEditor:ZipChange');
    lastUsedZip.current = cleaned;

    // Limpa valores dependentes do CEP no estado local
    setOwner(prev => ({ ...prev, [name]: cleaned, state: '', city: '' }));
    setCities([{ value: '', name: '' }]);
    setAllowManualLocation(false);

    // 1) Buscar STATES por ZIP
    const requestStatesUrl = url('api/find_state');
    xhr_address_service_fetch(requestStatesUrl, { zip_code: cleaned }, (data) => {
      const statesRaw: string[] = data && Array.isArray(data.states) ? data.states : [];
      const statesList: ISelectOption[] = [{ value: '', name: '' }, ...statesRaw.map((s: string) => ({ value: s, name: s }))];
      setStates(statesList);

      if (statesRaw.length === 1) {
        setOwner(prev => ({ ...prev, state: statesRaw[0] }));
      }

      // 2) Buscar CITIES por ZIP (NÃO depender do state)
      const requestCitiesUrl = url('api/find_city');
      xhr_address_service_fetch(requestCitiesUrl, { zip_code: cleaned }, (cdata) => {
        // Se o backend ainda exigir state, habilitar manual e sinalizar erro
        if (cdata && cdata.success === false && Array.isArray(cdata.message) && cdata.message.some((m: string) => /state is required/i.test(m))) {
          setCities([{ value: '', name: '' }]);
          setAllowManualLocation(true);
          setError(prev => {
            const fieldErrors = Object.assign({}, prev?.fieldErrors);
            fieldErrors['zipCode'] = {
              field: 'zipCode',
              message: 'O serviço de cities ainda exige "state", mas a aplicação usa apenas ZIP. Atualize o serviço para aceitar somente ZIP.'
            } as IFieldError;
            return { fieldErrors };
          });
          APMService.getInstance().endTransaction(false);
          return;
        }

        const citiesRaw: string[] = cdata && Array.isArray(cdata.cities) ? cdata.cities : [];
        const citiesList: ISelectOption[] = [{ value: '', name: '' }, ...citiesRaw.map((c: string) => ({ value: c, name: c }))];
        setCities(citiesList);

        if (citiesRaw.length === 1) {
          setOwner(prev => ({ ...prev, city: citiesRaw[0] }));
        }

        // Habilitar manual se algum vier vazio
        setAllowManualLocation(statesRaw.length === 0 || citiesRaw.length === 0);

        APMService.getInstance().endTransaction(true);
      });
    });
  }, [xhr_address_service_fetch]);

  const onStateChange = useCallback((name: string, value: string) => {
    // Apenas atualiza o state selecionado. A lista de cidades é sempre obtida por ZIP.
    setOwner(prev => ({ ...prev, [name]: value }));
  }, []);

  const onCityChange = useCallback((name: string, value: string) => {
    setOwner((prev) => Object.assign({}, prev, { [name]: value }));
  }, []);

  const onAddressFetch = useCallback((value: string, onSuccess: (data: any) => void) => {
    if (value.length > 3 && /\s/.test(value) && value !== owner.address) {
      APMService.getInstance().startTransaction('OwnerEditor:FindAddress');
      const requestUrl = url('api/find_address');

      xhr_address_service_fetch(
        requestUrl,
        {
          zip_code: owner.zipCode,
          state: owner.state,
          city: owner.city,
          address: value // usar o valor digitado
        },
        (data) => {
          if (data && Array.isArray(data.addresses)) {
            onSuccess(data.addresses);
            APMService.getInstance().endTransaction(true);
          } else {
            onSuccess([]); // evita travar o autocomplete
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

          {/* ZIP */}
          <Input
            object={owner}
            error={error as IError}
            constraint={NotEmpty}
            label="Zip Code"
            name="zipCode"
            onChange={onInputChange}
            onBlur={onZipChange}
            disabled={loading}
          />

          {/* STATE */}
          {allowManualLocation ? (
            <Input
              object={owner}
              error={error as IError}
              constraint={NotEmpty}
              label="State"
              name="state"
              onChange={onInputChange}
              disabled={loading}
            />
          ) : (
            <SelectInput
              object={owner}
              error={error}
              size={1}
              label="State"
              name="state"
              options={states}
              onChange={onStateChange}
              disabled={loading || states.length === 1}
            />
          )}

          {/* CITY */}
          {allowManualLocation ? (
            <Input
              object={owner}
              error={error as IError}
              constraint={NotEmpty}
              label="City"
              name="city"
              onChange={onInputChange}
              disabled={loading}
            />
          ) : (
            <SelectInput
              object={owner}
              error={error}
              size={1}
              label="City"
              name="city"
              options={cities}
              onChange={onCityChange}
              disabled={loading || cities.length === 1}
            />
          )}

          <AutocompleteInput value={owner.address} label="Address" name="address" onFetch={onAddressFetch} onChange={onAddressChange} disabled={loading} />
          <Input object={owner} error={error as IError} constraint={Digits(2)} label="Telephone" name="telephone" onChange={onInputChange} disabled={loading} />
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