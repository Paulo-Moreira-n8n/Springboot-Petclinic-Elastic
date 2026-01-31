
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { url, xhr_submitForm } from '../../util/index';
import { APMService, punish } from '../../main';
import Input from '../form/Input';
import DateInput from '../form/DateInput';
import SelectInput from '../form/SelectInput';

import { IError, IOwner, IPetRequest, IEditablePet, ISelectOption } from '../../types/index';

interface IPetEditorProps {
  pet: IEditablePet;
  owner: IOwner;
  pettypes: ISelectOption[];
}

const PetEditor: React.FC<IPetEditorProps> = ({ pet, owner, pettypes }) => {
  const navigate = useNavigate();
  const [editablePet, setEditablePet] = useState<IEditablePet>(() => Object.assign({}, pet));
  const [error, setError] = useState<IError | undefined>(undefined);

  punish();

  const onSubmit = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const request: IPetRequest = {
      id: editablePet.isNew ? null : editablePet.id,
      birthDate: editablePet.birthDate as any,
      name: editablePet.name,
      type: { id: editablePet.type_id as any },
      owner: {
        id: owner.id,
        firstName: owner.firstName,
        lastName: owner.lastName,
        city: owner.city,
        state: owner.state,
        zipCode: owner.zipCode,
        telephone: owner.telephone,
        address: owner.address,
        // @ts-expect-error manter compat até backend
        pets: null
      },
      visits: editablePet.visits
    };

    const endpoint = editablePet.isNew ? 'api/pets' : 'api/pets/' + editablePet.id;
    APMService.getInstance().startTransaction(editablePet.isNew ? 'CreatePet' : 'UpdatePet');

    xhr_submitForm(editablePet.isNew ? 'POST' : 'PUT', endpoint, request, (status, response) => {
      if (status === 204 || status === 201) {
        APMService.getInstance().endTransaction(true);
        navigate(`/owners/${owner.id}`);
      } else {
        APMService.getInstance().endTransaction(false);
        setError(response);
      }
    });
  }, [editablePet, owner, navigate]);

  const onInputChange = useCallback((name: string, value: string) => {
    setEditablePet((prev) => Object.assign({}, prev, { [name]: value }));
  }, []);

  const formLabel = editablePet.isNew ? 'Add Pet' : 'Update Pet';

  return (
    <span>
      <h2>{formLabel}</h2>
      {/* action não é necessária pois o submit é controlado */}
      <form className="form-horizontal" method="POST" action="#">
        <div className="form-group has-feedback">
          <div className="form-group">
            <label className="col-sm-2 control-label">Owner</label>
            <div className="col-sm-10">{owner.firstName} {owner.lastName}</div>
          </div>

          <Input object={editablePet} error={error as IError} label="Name" name="name" onChange={onInputChange} />
          <DateInput object={editablePet} error={error as IError} label="Birth date" name="birthDate" onChange={onInputChange} />
          <SelectInput object={editablePet} error={error} size={5} label="Type" name="type_id" options={pettypes} onChange={onInputChange} />
        </div>
        <div className="form-group">
          <div className="col-sm-offset-2 col-sm-10">
            <button className="btn btn-default" type="submit" onClick={onSubmit}>{formLabel}</button>
          </div>
        </div>
      </form>
    </span>
  );
};

export default PetEditor;
