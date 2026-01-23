import * as React from 'react';

import { IError, IInputChangeHandler, ISelectOption } from '../../types/index';

import FieldFeedbackPanel from './FieldFeedbackPanel';

export default ({object, error, size, name, label, disabled, options, onChange }: { object: any, error?: IError, size: number, name: string, label: string, disabled?: boolean, options: ISelectOption[], onChange?: IInputChangeHandler }) => {

  const handleOnChange = event => {
    onChange(name, event.target.value, null);
  };


  const selectedValue = object[name] || '';
  const fieldError = error && error.fieldErrors && error.fieldErrors[name];
  const valid = !fieldError && selectedValue !== '';

  const cssGroup = `form-group ${fieldError ? 'has-error' : ''}`;
  const num = size > 1 ? size : -1;
  return (
    <div className={cssGroup}>
      <label className='col-sm-2 control-label'>{label}</label>

      <div className='col-sm-10'>
        <select size={num} className='form-control' name={name} onChange={handleOnChange} value={selectedValue} disabled={ disabled }>
          {options.map(option => <option key={option.value} value={option.value as string}>{option.name}</option>)}
        </select>

      </div>
    </div>
  );
};
