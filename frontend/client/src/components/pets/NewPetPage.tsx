
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { IOwner, IEditablePet, ISelectOption } from '../../types/index';
import { APMService, punish } from '../../main';
import LoadingPanel from './LoadingPanel';
import PetEditor from './PetEditor';
import createPetEditorModel from './createPetEditorModel';

interface IPetEditorModel {
  pet?: IEditablePet;
  owner?: IOwner;
  pettypes?: ISelectOption[];
}

const NEW_PET: IEditablePet = {
  // @ts-expect-error: id nulo na criação
  id: null,
  isNew: true,
  name: '',
  birthDate: null as any,
  type: null as any,
  visits: [],
  owner: null as any
};

const NewPetPage: React.FC = () => {
  const { ownerId } = useParams();
  const initialRender = useRef(true);
  const [model, setModel] = useState<IPetEditorModel | undefined>(undefined);

  useEffect(() => {
    APMService.getInstance().startTransaction('NewPetPage');
    punish();

    const load = async () => {
      if (!ownerId) return;
      const m = await createPetEditorModel(ownerId, Promise.resolve(NEW_PET));
      APMService.getInstance().startSpan('Page Render', 'react');
      setModel(m);
    };

    load();

    return () => {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(false);
    };
  }, [ownerId]);

  useEffect(() => {
    if (initialRender.current && model) {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(true);
      initialRender.current = false;
    }
  }, [model]);

  if (!model) return <LoadingPanel />;

  return <PetEditor {...model} />;
};

export default NewPetPage;
