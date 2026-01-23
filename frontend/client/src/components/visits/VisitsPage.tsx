import * as React from 'react';

import { IOwner, IPet, IPetType, IVisit, IError, IRouterContext } from '../../types/index';

import { url, request, submitForm, xhr_request, xhr_submitForm } from '../../util/index';
import { NotEmpty } from '../form/Constraints';
import { APMService, punish } from '../../main';
import DateInput from '../form/DateInput';
import Input from '../form/Input';
import PetDetails from './PetDetails';


interface IVisitsPageProps {
  params: {
    ownerId: string,
    petId: string
  };
}

interface IVisitsPageState {
  visit?: IVisit;
  owner?: IOwner;
  error?: IError;
}

export default class VisitsPage extends React.Component<IVisitsPageProps, IVisitsPageState> {

 initial_render: boolean;
 context: IRouterContext;

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.initial_render = true;
    APMService.getInstance().startTransaction('VisitsPage');
    punish();
    this.onInputChange = this.onInputChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    const { params } = this.props;
    if (params && params.ownerId) {
      xhr_request(`api/owners/${params.ownerId}`, (status, owner) =>  {
        APMService.getInstance().startSpan('Page Render', 'react');
        this.setState( { owner: owner, visit: { id: null, isNew: true, date: null, description: '' } });
      });
    }
  }

  componentWillUnmount() {
    APMService.getInstance().endSpan();
    APMService.getInstance().endTransaction(false);
  }

  componentDidUpdate() {
    if (this.initial_render) {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(true);
    }
    this.initial_render = false;
  }

  onSubmit(event) {
    event.preventDefault();
    APMService.getInstance().startTransaction('CreateVisit');
    const petId = this.props.params.petId;
    const { owner, visit } = this.state;
    let pet = owner.pets.find(candidate => candidate.id.toString() === petId);
    const request = {
      id: null,
      date: visit.date,
      description: visit.description,
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

    const url = 'api/visits';
    xhr_submitForm('POST', url, request, (status, response) => {
      if (status === 201) {
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
    const { visit } = this.state;

    this.setState(
      { visit: Object.assign({}, visit, { [name]: value }) }
    );
  }

  render() {
    if (!this.state) {
      return <h2>Loading...</h2>;
    }

    const { owner, error, visit } = this.state;
    const petId = this.props.params.petId;

    const pet = owner.pets.find(candidate => candidate.id.toString() === petId);

    return (
      <div>
        <h2>Visits</h2>
        <b>Pet</b>
        <PetDetails owner={owner} pet={pet} />

        <form className='form-horizontal' method='POST' action={url('/api/owner')}>
          <div className='form-group has-feedback'>
            <DateInput object={visit} error={error} label='Date' name='date' onChange={this.onInputChange} />
            <Input object={visit} error={error} constraint={NotEmpty} label='Description' name='description' onChange={this.onInputChange} />
          </div>
          <div className='form-group'>
            <div className='col-sm-offset-2 col-sm-10'>
              <button className='btn btn-default' type='submit' onClick={this.onSubmit}>Add Visit</button>
            </div>
          </div>
        </form>
      </div>
    );
  }
}
