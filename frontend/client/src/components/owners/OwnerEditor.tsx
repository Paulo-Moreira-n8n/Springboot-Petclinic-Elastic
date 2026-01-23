import * as React from 'react';

import { IRouter, Link } from 'react-router';
import { url, submitForm, request_promise, xhr_submitForm, xhr_request_promise } from '../../util/index';
import Input from '../form/Input';
import SelectInput from '../form/SelectInput';
import AutocompleteInput from '../form/AutocompleteInput';
import { APMService, punish } from '../../main';
import { Digits, NotEmpty } from '../form/Constraints';
import { IInputChangeHandler, IFieldError, IError, IOwner, IRouterContext, ISelectOption } from '../../types/index';

interface IOwnerEditorProps {
  initialOwner?: IOwner;
}

interface IOwnerEditorState {
  owner?: IOwner;
  error?: IError;
  states?: ISelectOption[];
  cities?: ISelectOption[];
  addresses?: ISelectOption[];
  loading?: boolean;
};

export default class OwnerEditor extends React.Component<IOwnerEditorProps, IOwnerEditorState> {

  context: IRouterContext;
  initial_render: boolean;
  last_used_zip: string;

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    APMService.getInstance().startTransaction('OwnerEditor');
    punish();
    this.initial_render = true;
    this.last_used_zip = null;
    this.onInputChange = this.onInputChange.bind(this);
    this.onZipChange = this.onZipChange.bind(this);
    this.address_service_fetch = this.address_service_fetch.bind(this);
    this.xhr_address_service_fetch = this.xhr_address_service_fetch.bind(this);
    this.onStateChange = this.onStateChange.bind(this);
    this.onCityChange = this.onCityChange.bind(this);
    this.onAddressChange = this.onAddressChange.bind(this);
    this.onAddressFetch = this.onAddressFetch.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.state = {
      owner: Object.assign({}, props.initialOwner),
      states: [{'value': '', 'name': ''}],
      cities: [{'value': '', 'name': ''}],
      addresses: []
    };
  }

  componentDidMount() {
    if (this.state.owner.zipCode && this.state.owner.zipCode !== '') {
      return Promise.all(
        [
          xhr_request_promise('api/find_state', 'POST', { zip_code: this.state.owner.zipCode }),
          xhr_request_promise('api/find_city', 'POST', { zip_code: this.state.owner.zipCode, state: this.state.owner.state })
        ]
      ).then(response => {
        // TODO: Currently fails silently - maybe warn if error vs no data
        APMService.getInstance().startSpan('Page Render', 'react');
        let states = response[0] && response[0].states ? response[0].states.map(state => ({ value: state, name: state })) : [];
        states.unshift({'value': '', 'name': ''});
        let cities = response[1] && response[1].cities ? response[1].cities.map(state => ({ value: state, name: state })) : [];
        cities.unshift({'value': '', 'name': ''});
        this.setState({
          states: states,
          cities: cities
        });
      });
    } else {
      APMService.getInstance().startSpan('Page Render', 'react');
      this.setState({
        states: [{'value': '', 'name': ''}],
        cities: [{'value': '', 'name': ''}]
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
    const { owner } = this.state;
    const url = owner.isNew ? 'api/owners' : 'api/owners/' + owner.id;
    this.setState({ error: {'fieldErrors': {}}, loading: true });
    APMService.getInstance().startTransaction( owner.isNew ? 'CreateOwner' : 'UpdateOwner');
    event.preventDefault();
    xhr_submitForm(owner.isNew ? 'POST' : 'PUT', url, owner, (status, response) => {
      if (status === 204 || status === 201) {
        APMService.getInstance().endTransaction(true);
        const owner_id = owner.isNew ? (response as IOwner).id : owner.id;
        this.context.router.push({
          pathname: '/owners/' + owner_id
        });
      } else {
        APMService.getInstance().endTransaction(false);
        let fieldErrors = response.reduce(function(map, error) {
            map[error.fieldName] = { 'field': error.fieldName, 'message': error.errorMessage };
            return map;
        }, {});
        this.setState({ error: {'fieldErrors': fieldErrors}, loading: false });
      }
    });
  }

  onInputChange(name: string, value: string, fieldError: IFieldError) {
    const { owner, error } = this.state;
    const modifiedOwner = Object.assign({}, owner, { [name]: value });
    const newFieldErrors = error ? Object.assign({}, error.fieldErrors, {[name]: fieldError }) : {[name]: fieldError };
    this.setState({
      owner: modifiedOwner,
      error: { fieldErrors: newFieldErrors }
    });
  }

  address_service_fetch = (requestUrl: string, fetchParams: any, onSuccess: (data: any) => void) => {
    fetch(requestUrl, fetchParams)
      .then(response =>  {
          if (response.status === 200) {
              response.json().then(data => {
                  onSuccess(data);
              });
          } else {
            APMService.getInstance().captureError(`Failed POST on ${requestUrl} - ${response.status} ${response.statusText}`);
            onSuccess(null);
          }
      });
  }

  // temporarily needed as fetch isn't supported by Elastic APM
  xhr_address_service_fetch = (requestUrl: string, body: any, onSuccess: (data: any) => void) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', requestUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function(e) {
      if (xhr.status ===  200) {
          onSuccess(JSON.parse(xhr.responseText));
      } else {
        APMService.getInstance().captureError(`Failed GET on ${requestUrl} - ${xhr.status} ${xhr.statusText}`);
        onSuccess(null);
      }
    };
    xhr.onerror = function(e) {
       APMService.getInstance().captureError(`Failed GET on ${requestUrl} - ${xhr.status} ${xhr.statusText}`);
       onSuccess(null);
    };
    let payload = null;
    if (body) {
      payload = JSON.stringify(body);
    }
    xhr.send(payload);
  };


  onZipChange(name: string, value: string) {
    const { owner } = this.state;
    if (value.trim() !== '' && this.last_used_zip !== value) {
      APMService.getInstance().startTransaction('OwnerEditor:ZipChange');
      const requestUrl = url('api/find_state');
      this.xhr_address_service_fetch(requestUrl, { zip_code: value }, (data) => {
        if (data) {
          let states = data.states ? data.states.map(state => ({ value: state, name: state })) : [];
          const modifiedOwner = Object.assign({}, owner, { [name]: value, ['state']: '', ['city']: '' });
          states.unshift({'value': '', 'name': ''});
          APMService.getInstance().endTransaction(true);
          this.last_used_zip = value;
          this.setState({
            owner: modifiedOwner,
            states: states,
            cities: [{'value': '', 'name': ''}]
          });
        } else {
          // TODO: silent failure curently. Indicate failure to user
          APMService.getInstance().endTransaction(false);
        }
      });
    }
  }

  onStateChange(name: string, value: string, fieldError: IFieldError) {
    APMService.getInstance().startTransaction('OwnerEditor:StateChange');
    const requestUrl = url('api/find_city');
    const { owner } = this.state;
    const modifiedOwner = Object.assign({}, owner, { [name]: value, ['city']: '' });
    this.setState({
      owner: modifiedOwner
    });
    this.xhr_address_service_fetch(requestUrl, { zip_code: owner.zipCode, state: value }, (data) => {
      if (data) {
        let cities = data.cities ? data.cities.map(city => ({ value: city, name: city })) : [];
        cities.unshift({'value': '', 'name': ''});
        APMService.getInstance().endTransaction(true);
        this.setState({
          cities: cities
        });
      } else {
        // TODO: silent failure curently. Indicate failure to user
        APMService.getInstance().endTransaction(false);
      }
    });
  }

  onCityChange(name: string, value: string, fieldError: IFieldError) {
    const { owner } = this.state;
    const modifiedOwner = Object.assign({}, owner, { [name]: value });
    this.setState({
      owner: modifiedOwner
    });
  }

  onAddressFetch(value: string, onSuccess: (data: any) => void ) {
    const { owner } = this.state;
    if (value.length > 3 && /\s/.test(value) && value !== owner.address) {
      APMService.getInstance().startTransaction('OwnerEditor:FindAddress');
      const requestUrl = url('api/find_address');
      this.xhr_address_service_fetch(requestUrl, { zip_code: owner.zipCode, state: owner.state, city: owner.city, address: owner.address }, (data) => {
        if (data) {
          onSuccess(data.addresses);
          APMService.getInstance().endTransaction(true);
        } else {
          APMService.getInstance().endTransaction(false);
        }

        // TODO: silent failure curently. Indicate failure to user
      });
    }
  }

  onAddressChange(value: string ) {
    const { owner } = this.state;
    const modifiedOwner = Object.assign({}, owner, { ['address']: value });
    this.setState({
      owner: modifiedOwner
    });
  }

  render() {
    const { owner, error, states, cities, addresses, loading } = this.state;
    return (
        <span id='owner_editor'>
          <div className='loader' style={ !loading ? { 'display': 'none' } : {} }></div>
          <h2>{owner.isNew ? 'Add Owner' : 'Update Owner'}</h2>
          <form className='form-horizontal' method='POST' action={url(owner.isNew ? 'api/owners' : 'api/owners/' + owner.id)}>
            <div className='form-group has-feedback'>
              <Input object={owner} error={error} constraint={NotEmpty} label='First Name' name='firstName' onChange={this.onInputChange} disabled={loading} />
              <Input object={owner} error={error} constraint={NotEmpty} label='Last Name' name='lastName' onChange={this.onInputChange} disabled={loading} />
              <Input object={owner} error={error} constraint={NotEmpty} label='Zip Code' name='zipCode' onChange={this.onInputChange} onBlur={this.onZipChange} disabled={loading} />
              <SelectInput object={owner} error={error} size={1} label='State' name='state' options={states} onChange={this.onStateChange} disabled={loading || states.length === 1} />
              <SelectInput object={owner} error={error} size={1} label='City' name='city' options={cities} onChange={this.onCityChange} disabled={loading || cities.length === 1}/>
              <AutocompleteInput value={owner.address} label='Address' name='address' onFetch={this.onAddressFetch} onChange={this.onAddressChange} disabled={loading} />
              <Input object={owner} error={error} constraint={Digits(10)} label='Telephone' name='telephone' onChange={this.onInputChange} disabled={loading} />
            </div>
            <div className='form-group'>
              <div className='col-sm-offset-2 col-sm-10'>
                <button className='btn btn-default' type='submit' onClick={this.onSubmit}>{owner.isNew ? 'Add Owner' : 'Update Owner'}</button>
              </div>
            </div>
          </form>
        </span>
    );
  }
}
