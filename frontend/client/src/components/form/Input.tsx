import * as React from 'react';

import { IConstraint, IError, IInputChangeHandler, IInputBlurHandler} from '../../types/index';

import FieldFeedbackPanel from './FieldFeedbackPanel';

const NoConstraint: IConstraint = {
  message: '',
  validate: v => true
};


export default ({object, error, name, constraint = NoConstraint, label, disabled, onChange, onBlur }: { object: any, error: IError, name: string, constraint?: IConstraint, label: string, disabled?: boolean, onChange?: IInputChangeHandler, onBlur?: IInputBlurHandler }) => {

  const handleOnChange = event => {
    if (onChange) {
      const { value } = event.target;

      // run validation (if any)
      let error = null;
      const fieldError = constraint.validate(value) === false ? { field: name, message: constraint.message } : null;

      // invoke callback
      onChange(name, value, fieldError);
    }
  };

  const handleOnBlur = event => {
    const { value } = event.target;
    if (onBlur) {
      onBlur(name, value);
    }
  };

  const value = object[name];
  const fieldError = error && error.fieldErrors && error.fieldErrors[name];
  const valid = !fieldError && value !== null && value !== undefined;

  const cssGroup = `form-group ${fieldError ? 'has-error' : ''}`;

  return (
    <div className={cssGroup}>
      <label className='col-sm-2 control-label'>{label}</label>
      <div className='col-sm-10'>
        <input type='text' name={name} className='form-control' defaultValue={value} onChange={handleOnChange} onBlur={handleOnBlur} disabled={ disabled }/>
         <FieldFeedbackPanel valid={valid} fieldError={fieldError} />
      </div>
    </div>
  );
};
