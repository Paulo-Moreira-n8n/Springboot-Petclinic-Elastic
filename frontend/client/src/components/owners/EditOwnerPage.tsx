
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import OwnerEditor from './OwnerEditor';
import { APMService, punish } from '../../main';
import { IOwner } from '../../types/index';
import { xhr_request } from '../../util/index';

const EditOwnerPage: React.FC = () => {
  const { ownerId } = useParams();
  const [owner, setOwner] = useState<IOwner | undefined>(undefined);

  useEffect(() => {
    APMService.getInstance().startTransaction('EditOwnerPage');
    punish();

    if (ownerId) {
      xhr_request(`api/owners/${ownerId}`, (status, data) => {
        APMService.getInstance().endTransaction(true);
        setOwner(data as IOwner);
      });
    } else {
      APMService.getInstance().endTransaction(true);
    }

    return () => {
      APMService.getInstance().endSpan();
      APMService.getInstance().endTransaction(false);
    };
  }, [ownerId]);

  if (owner) {
    return <OwnerEditor initialOwner={owner} />;
  }

  return null;
};

export default EditOwnerPage;
