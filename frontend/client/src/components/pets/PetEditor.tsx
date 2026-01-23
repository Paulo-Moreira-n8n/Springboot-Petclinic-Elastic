import * as React from 'react';

import { IRouter, Link } from 'react-router';
import { url, submitForm, xhr_submitForm } from '../../util/index';
import { APMService, punish } from '../../main';
import Input from '../form/Input';
import DateInput from '../form/DateInput';
import SelectInput from '../form/SelectInput';

import { IError, IOwner, IPetRequest, IEditablePet, IPet, IPetType, IPetTypeRequest, IRouterContext, ISelectOption } from '../../types/index';

interface IPetEditorProps {
  pet: IEditablePet;
  owner: IOwner;
  pettypes: ISelectOption[];
}

interface IPetEditorState {
  editablePet?: IEditablePet;
  error?: IError;
};

export default class PetEditor extends React.Component<IPetEditorProps, IPetEditorState> {

  context: IRouterContext;

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };


  constructor(props) {
    super(props);
    punish();
    this.onInputChange = this.onInputChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.state = { editablePet: Object.assign({}, props.pet ) };
  }

  onSubmit(event) {
    event.preventDefault();

    const { owner, pettypes } = this.props;
    const { editablePet } = this.state;
    let request: IPetRequest = {
      id: null,
      birthDate: editablePet.birthDate,
      name: editablePet.name,
      type: {
        id: editablePet.type_id
      },
      owner: {
        id: owner.id,
        firstName: owner.firstName,
        lastName: owner.lastName,
        city: owner.city,
        state: owner.state,
        zipCode: owner.zipCode,
        telephone: owner.telephone,
        address: owner.address,
        pets: null
      },
      visits: editablePet.visits
    };

    if (!editablePet.isNew) {
      request.id = editablePet.id;
    }

    const url = editablePet.isNew ? 'api/pets' :  'api/pets/' + editablePet.id;
    APMService.getInstance().startTransaction( editablePet.isNew ? 'CreatePet' : 'UpdatePet');

    xhr_submitForm(editablePet.isNew ? 'POST' : 'PUT', url, request, (status, response) => {
      if (status === 204 || status === 201) {
        APMService.getInstance().endTransaction(true);
        this.context.router.push({
          pathname: '/owners/' + owner.id
        });
      } else {
        APMService.getInstance().endTransaction(false);
        console.log('ERROR?!...', response);
        this.setState({ error: response });
      }
    });
  }

  onInputChange(name: string, value: string) {
    const { editablePet } = this.state;
    const modifiedPet = Object.assign({}, editablePet, { [name]: value });

    this.setState({ editablePet: modifiedPet });
  }

  render() {
    const { owner, pettypes } = this.props;
    const { editablePet, error } = this.state;
    const formLabel = editablePet.isNew ? 'Add Pet' : 'Update Pet';

    return (
      <span>
        <h2>{formLabel}</h2>
        <form className='form-horizontal' method='POST' action={url('/api/owner')}>
          <div className='form-group has-feedback'>
            <div className='form-group'>
              <label className='col-sm-2 control-label'>Owner</label>
              <div className='col-sm-10'>{owner.firstName} {owner.lastName}</div>
            </div>

            <Input object={editablePet} error={error} label='Name' name='name' onChange={this.onInputChange} />
            <DateInput object={editablePet} error={error} label='Birth date' name='birthDate' onChange={this.onInputChange} />
            <SelectInput object={editablePet} error={error} size={5} label='Type' name='type_id' options={pettypes} onChange={this.onInputChange} />
          </div>
          <div className='form-group'>
            <div className='col-sm-offset-2 col-sm-10'>
              <button className='btn btn-default' type='submit' onClick={this.onSubmit}>{formLabel}</button>
            </div>
          </div>
        </form>
      </span>
    );
  }
}
