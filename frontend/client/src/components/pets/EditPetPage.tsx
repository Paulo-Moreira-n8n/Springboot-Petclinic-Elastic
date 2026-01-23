import * as React from 'react';

import { IOwner, IEditablePet, ISelectOption } from '../../types/index';
import { request, request_promise, xhr_request_promise } from '../../util/index';
import { APMService, punish } from '../../main';
import LoadingPanel from './LoadingPanel';
import PetEditor from './PetEditor';

import createPetEditorModel from './createPetEditorModel';

interface IEditPetPageProps {
  params: {
    ownerId: string,
    petId: string
  };
}

interface IEditPetPageState {
  pet?: IEditablePet;
  owner?: IOwner;
  pettypes?: ISelectOption[];
};

export default class EditPetPage extends React.Component<IEditPetPageProps, IEditPetPageState> {

  initial_render: boolean;

  constructor() {
    super();
    this.initial_render = true;
    APMService.getInstance().startTransaction('EditPetPage');
    punish();
  }

  componentDidMount() {
    const { params } = this.props;
    const loadPetPromise = xhr_request_promise(`api/pets/${params.petId}`);
    createPetEditorModel(this.props.params.ownerId, loadPetPromise)
      .then(model => {
            APMService.getInstance().startSpan('Page Render', 'react');
            this.setState(model);
          }
      );
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
    if (!this.state) {
      return <LoadingPanel />;
    }

    return <PetEditor {...this.state} />;
  }
}
