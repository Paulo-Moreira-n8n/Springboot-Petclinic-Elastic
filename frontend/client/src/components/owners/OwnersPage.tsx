
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { IOwner } from '../../types/index';
import { xhr_request } from '../../util/index';
import OwnerInformation from './OwnerInformation';
import PetsTable from './PetsTable';
import { APMService, punish } from '../../main';

const OwnersPage: React.FC = () => {
  const { ownerId } = useParams();
  const initialRender = useRef(true);
  const [owner, setOwner] = useState<IOwner | undefined>(undefined);

  useEffect(() => {
    APMService.getInstance().startTransaction('OwnersPage');
    punish();

    if (ownerId) {
      xhr_request(`api/owners/${ownerId}`, (status, data) => {
        APMService.getInstance().startSpan('Page Render', 'react');
        setOwner(data as IOwner);
      });
    }

    return () => {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(false);
    };
  }, [ownerId]);

  useEffect(() => {
    if (initialRender.current) {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(true);
      initialRender.current = false;
    }
  }, [owner]);

  if (!owner) {
    return <h2>No Owner loaded</h2>;
  }

  return (
    <span>
      <OwnerInformation owner={owner} />
      <PetsTable owner={owner} />
    </span>
  );
};

export default OwnersPage;
