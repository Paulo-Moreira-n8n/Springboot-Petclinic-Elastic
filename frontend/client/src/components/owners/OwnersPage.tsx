import * as React from 'react';

import { Link } from 'react-router';
import { IOwner } from '../../types/index';
import { request, xhr_request } from '../../util/index';
import OwnerInformation from './OwnerInformation';
import PetsTable from './PetsTable';
import { APMService, punish } from '../../main';

interface IOwnersPageProps {
  params?: { ownerId?: string };
}

interface IOwnerPageState {
  owner?: IOwner;
}

export default class OwnersPage extends React.Component<IOwnersPageProps, IOwnerPageState> {

  initial_render: boolean;

  constructor() {
    super();
    this.initial_render = true;
    APMService.getInstance().startTransaction('OwnersPage');
    punish();
    this.state = {};
  }

  componentDidMount() {
    const { params } = this.props;

    if (params && params.ownerId) {
      xhr_request(`api/owners/${params.ownerId}`, (status, owner) =>  {
        APMService.getInstance().startSpan('Page Render', 'react');
        this.setState({ owner });
      });
    }
  }

  componentDidUpdate() {
    if (this.initial_render) {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(true);
    }
    this.initial_render = false;
  }

  componentWillUnmount() {
    APMService.getInstance().endSpan();
    APMService.getInstance().endTransaction(false);
  }

  render() {
    const { owner } = this.state;

    if (!owner) {
      return <h2>No Owner loaded</h2>;
    }

    return (
      <span>
        <OwnerInformation owner={owner} />
        <PetsTable owner={owner} />
      </span>
    );
  }
}
