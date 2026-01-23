import * as React from 'react';
import OwnerEditor from './OwnerEditor';
import { APMService, punish } from '../../main';
import { IOwner } from '../../types/index';
import { url } from '../../util/index';
import { request, xhr_request } from '../../util/index';

interface IEditOwnerPageProps {
  params?: { ownerId?: string };
}

interface IEditOwnerPageState {
  owner: IOwner;
}

export default class EditOwnerPage extends React.Component<IEditOwnerPageProps, IEditOwnerPageState> {

  constructor(props) {
    super(props);
  }

  componentWillMount() {
    APMService.getInstance().startTransaction('EditOwnerPage');
    punish();
  }

  componentDidMount() {
    const { params } = this.props;

    if (params && params.ownerId) {
      xhr_request(`api/owners/${params.ownerId}`, (status, owner) =>  {
        APMService.getInstance().endTransaction(true);
        this.setState({ owner });
      });
    } else {
      APMService.getInstance().endTransaction(true);
    }
  }

  componentWillUnmount() {
    APMService.getInstance().endSpan();
    APMService.getInstance().endTransaction(false);
  }

  render() {
    const owner = this.state && this.state.owner;
    if (owner) {
      return <OwnerEditor initialOwner={owner} />;
    }
    return null;
  }
}
