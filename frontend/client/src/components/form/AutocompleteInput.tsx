
import React from 'react';
import Autosuggest from 'react-autosuggest';
import { IInputFetchHandler, IInputValueHandler } from '../../types/index';

import FieldFeedbackPanel from './FieldFeedbackPanel';

interface IAutocompleteProps {
  name: string;
  label: string;
  value: string;
  onFetch: IInputFetchHandler;
  onChange: IInputValueHandler;
  disabled: boolean;
}

interface IAutocompleteState {
  suggestions: string[];
}

export default class AutocompleteInput extends React.Component<IAutocompleteProps, IAutocompleteState> {
  constructor(props: IAutocompleteProps) {
    super(props);
    this.state = { suggestions: [] };
  }

  getSuggestionValue = (suggestion: string) => suggestion;

  renderSuggestion = (suggestion: string) => <span>{suggestion}</span>;

  onSuggestionsFetchRequested = ({ value }: { value: string }) => {
    this.props.onFetch(value, (data) => {
      this.setState({ suggestions: data });
    });
  };

  onSuggestionsClearRequested = () => this.setState({ suggestions: [] });

  onChange = (_event: any, { newValue }: { newValue: string }) => {
    this.props.onChange(newValue);
  };

  render() {
    const { suggestions } = this.state;
    const { value, label, disabled } = this.props;

    const inputProps = { placeholder: '', value, onChange: this.onChange };
    const cssGroup = `form-group`;

    return (
      <div className={cssGroup}>
        <label className="col-sm-2 control-label">{label}</label>
        <div className={disabled ? 'disable-form-control col-sm-10' : 'col-sm-10'}>
          <Autosuggest
            className="form-control"
            suggestions={suggestions}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            getSuggestionValue={this.getSuggestionValue}
            renderSuggestion={this.renderSuggestion}
            inputProps={inputProps}
          />
        </div>
      </div>
    );
  }
}
