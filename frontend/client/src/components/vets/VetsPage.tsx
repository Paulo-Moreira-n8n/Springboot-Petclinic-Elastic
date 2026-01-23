import * as React from 'react';

import { Router, Link } from 'react-router';
import { request, xhr_request } from '../../util/index';
import { IVet } from '../../types/index';
import { APMService, punish } from '../../main';
interface IVetsPageState {
  vets: IVet[];
}

export default class VetsPage extends React.Component<void, IVetsPageState> {

  initial_render: boolean;
  constructor() {
    super();
    this.initial_render = true;
    APMService.getInstance().startTransaction('VetsPage');
    punish();
    this.state = { vets: [] };
  }

  componentDidMount() {
    xhr_request('api/vets', (status, vets) =>  {
      if (status < 400) {
        APMService.getInstance().startSpan('Page Render', 'react');
        this.setState({ vets });
      }
    });
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

  render() {
    const { vets } = this.state;

    if (!vets) {
      return <h2>Veterinarians</h2>;
    }

    return (
      <span>
        <h2>Veterinarians</h2>
        <table className='table table-striped'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialties</th>
            </tr>
          </thead>
          <tbody>

            {vets.map(vet => (
              <tr key={vet.id}>
                <td>{vet.firstName} {vet.lastName}</td>
                <td>{vet.specialties.length > 0 ? vet.specialties.map(specialty => specialty.name).join(', ') : 'none'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </span>
    );
  }
}
