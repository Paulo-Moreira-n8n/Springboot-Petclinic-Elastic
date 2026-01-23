import * as React from 'react';

import { IOwner, IEditablePet, ISelectOption } from '../../types/index';

import { url } from '../../util/index';
import { APMService, punish } from '../../main';
import LoadingPanel from './LoadingPanel';
import PetEditor from './PetEditor';

import createPetEditorModel from './createPetEditorModel';

interface INewPetPageProps {
  params: { ownerId: string };
}

interface INewPetPageState {
  pet?: IEditablePet;
  owner?: IOwner;
  pettypes?: ISelectOption[];
};

const NEW_PET: IEditablePet = {
  id: null,
  isNew: true,
  name: '',
  birthDate: null,
  type: null,
  visits: [],
  owner: null
};

export default class NewPetPage extends React.Component<INewPetPageProps, INewPetPageState> {


  initial_render: boolean;

  constructor() {
    super();
    this.initial_render = true;
    APMService.getInstance().startTransaction('NewPetPage');
    punish();
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

  componentDidMount() {
    createPetEditorModel(this.props.params.ownerId, Promise.resolve(NEW_PET))
      .then(model => {
        APMService.getInstance().startSpan('Page Render', 'react');
        this.setState(model);
      });
  }

  render() {
    if (!this.state) {
      return <LoadingPanel />;
    }

    return <PetEditor {...this.state} />;
  }
}
