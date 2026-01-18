
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { IOwner, IVisit, IError } from '../../types/index';
import { xhr_request, xhr_submitForm } from '../../util/index';
import { NotEmpty } from '../form/Constraints';
import { APMService, punish } from '../../main';
import DateInput from '../form/DateInput';
import Input from '../form/Input';
import PetDetails from './PetDetails';

interface IVisitsState {
  visit?: IVisit;
  owner?: IOwner;
  error?: IError;
}

const VisitsPage: React.FC = () => {
  const { ownerId, petId } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState<IVisitsState | undefined>(undefined);
  const initialRender = useRef(true);

  useEffect(() => {
    APMService.getInstance().startTransaction('VisitsPage');
    punish();

    if (ownerId) {
      xhr_request(`api/owners/${ownerId}`, (status, owner) => {
        APMService.getInstance().startSpan('Page Render', 'react');
        setState({
          owner,
          // @ts-expect-error manter compat com DateInput (string|null aceito)
          visit: { id: null, isNew: true, date: null, description: '' }
        });
      });
    }

    return () => {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(false);
    };
  }, [ownerId]);

  useEffect(() => {
    if (initialRender.current && state?.owner) {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(true);
      initialRender.current = false;
    }
  }, [state]);

  const onInputChange = useCallback((name: string, value: string) => {
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, visit: Object.assign({}, prev.visit, { [name]: value }) };
    });
  }, []);

  const onSubmit = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!state?.owner || !petId) return;

    APMService.getInstance().startTransaction('CreateVisit');
    const { owner, visit } = state;
    const pet = owner.pets.find((p) => String(p.id) === String(pId));

    if (!pet) return;

    const request = {
      id: null,
      date: visit?.date as any,
      description: visit?.description,
      pet: {
        birthDate: pet.birthDate,
        id: pet.id,
        name: pet.name,
        type: pet.type,
        visits: [],
        owner: {
          address: owner.address,
          city: owner.city,
          state: owner.state,
          zipCode: owner.zipCode,
          firstName: owner.firstName,
          lastName: owner.lastName,
          telephone: owner.telephone,
          pets: [],
          id: owner.id
        }
      }
    };

    xhr_submitForm('POST', 'api/visits', request, (status, response) => {
      if (status === 201) {
        APMService.getInstance().endTransaction(true);
        navigate(`/owners/${owner.id}`);
      } else {
        APMService.getInstance().endTransaction(false);
        setState((prev) => ({ ...(prev as IVisitsState), error: response }));
      }
    });
  }, [state, petId, navigate]);

  if (!state?.owner) {
    return <h2>Loading...</h2>;
  }

  const { owner, error, visit } = state;
  const pet = owner.pets.find((p) => String(p.id) === String(petId));

  if (!pet) return <h2>Pet not found</h2>;

  return (
    <div>
      <h2>Visits</h2>
      <b>Pet</b>
      <PetDetails owner={owner} pet={pet} />

      {/* action não é necessária, submit controlado */}
      <form className="form-horizontal" method="POST" action="#">
        <div className="form-group has-feedback">
          <DateInput object={visit as any} error={error as IError} label="Date" name="date" onChange={onInputChange} />
          <Input object={visit as any} error={error as IError} constraint={NotEmpty} label="Description" name="description" onChange={onInputChange} />
        </div>
        <div className="form-group">
          <div className="col-sm-offset-2 col-sm-10">
            <button className="btn btn-default" type="submit" onClick={onSubmit}>Add Visit</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VisitsPage;
