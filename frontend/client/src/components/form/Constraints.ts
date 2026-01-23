import { IConstraint } from '../../types/index';

export const NotEmpty: IConstraint = {
  message:    'Enter at least one character',
  validate: (value) => {
    return !!value && value.length > 0;
  }
};

export const Digits = (digits: number): IConstraint => {
  const reg = new RegExp('^\\d{1,' + digits + '}$');
  return {
    message: 'Must be a number with at most ' + digits + ' digits',
    validate: (value) => {
      return !!value && value.match(reg) !== null;
    }
  };
};

// This is suseptible to DDoS.
export const Email = (digits: number): IConstraint => {
  const isEmail = /^([a-zA-Z0-9])(([-.]|[_]+)?([a-zA-Z0-9]+))*(@){1}[a-z0-9]+[.]{1}(([a-z]{2,3})|([a-z]{2,3}[.]{1}[a-z]{2,3}))$/;
  return {
    message: 'Must be a valid email',
    validate: (value) => {
      return !!value && isEmail.test(value);
    }
  };
};
