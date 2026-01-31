
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { IOwner, IEditablePet, ISelectOption } from '../../types/index';
import { xhr_request_promise } from '../../util/index';
import { APMService, punish } from '../../main';
import LoadingPanel from './LoadingPanel';
import PetEditor from './PetEditor';
import createPetEditorModel from './createPetEditorModel';

interface IPetEditorModel {
  pet?: IEditablePet;
  owner?: IOwner;
  pettypes?: ISelectOption[];
}

const EditPetPage: React.FC = () => {
  const { ownerId, petId } = useParams();
  const initialRender = useRef(true);
  const [model, setModel] = useState<IPetEditorModel | undefined>(undefined);

  useEffect(() => {
    APMService.getInstance().startTransaction('EditPetPage');
    punish();

    const load = async () => {
      if (!ownerId || !petId) return;
      const loadPetPromise = xhr_request_promise(`api/pets/${petId}`);
      const m = await createPetEditorModel(ownerId, loadPetPromise);
      APMService.getInstance().startSpan('Page Render', 'react');
      setModel(m);
    };

    load();

    return () => {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(false);
    };
  }, [ownerId, petId]);

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

export default EditPetPage;
