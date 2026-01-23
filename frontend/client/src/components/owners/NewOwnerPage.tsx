import * as React from 'react';
import OwnerEditor from './OwnerEditor';

import { IOwner } from '../../types/index';

const newOwner = (): IOwner => ({
  id: null,
  isNew: true,
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  telephone: '',
  pets: []
});

export default () => <OwnerEditor initialOwner={newOwner()} />;
