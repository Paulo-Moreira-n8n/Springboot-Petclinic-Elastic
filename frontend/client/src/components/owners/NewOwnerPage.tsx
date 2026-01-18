
import React from 'react';
import OwnerEditor from './OwnerEditor';
import { IOwner } from '../../types/index';

const newOwner = (): IOwner => ({
  // @ts-expect-error: id nulo em criação (tipagem original usa number)
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
