
import React from 'react';
import DatePicker from 'react-datepicker';
import { IError, IInputChangeHandler } from '../../types/index';
import FieldFeedbackPanel from './FieldFeedbackPanel';

function parseYMD(s?: string | null): Date | null {
  if (!s) return null;
  // aceita "YYYY/MM/DD"
  const m = /^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/.exec(s);
  if (!m) return null;
  const [_, y, mo, d] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d));
  return isNaN(dt.getTime()) ? null : dt;
}

export default ({
  object,
  error,
  name,
  label,
  onChange
}: {
  object: any;
  error: IError;
  name: string;
  label: string;
  onChange: IInputChangeHandler;
}) => {
  const selectedValue = parseYMD(object[name]);
  const fieldError = error && error.fieldErrors && error.fieldErrors[name];
  const valid = !fieldError && selectedValue != null;

  const cssGroup = `form-group ${fieldError ? 'has-error' : ''}`;

  const handleOnChange = (value: Date | null) => {
    const dateString =
      value != null
        ? `${value.getFullYear()}/${String(value.getMonth() + 1).padStart(2, '0')}/${String(value.getDate()).padStart(2, '0')}`
        : null;
    onChange(name, dateString as any, null);
  };

  return (
    <div className={cssGroup}>
      <label className="col-sm-2 control-label">{label}</label>

      <div className="col-sm-10">
        <DatePicker
          selected={selectedValue}
          onChange={handleOnChange}
          className="form-control"
          dateFormat="yyyy-MM-dd"
        />
        <span className="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>
        <FieldFeedbackPanel valid={valid} fieldError={fieldError} />
      </div>
    </div>
  );
};
