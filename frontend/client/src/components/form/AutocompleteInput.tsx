import React from 'react';
import Autosuggest, { SuggestionsFetchRequestedParams, ChangeEvent } from 'react-autosuggest';
import { IInputFetchHandler, IInputValueHandler } from '../../types/index';

import FieldFeedbackPanel from './FieldFeedbackPanel';

interface IAutocompleteProps {
  name: string;
  label: string;
  value: string;
  onFetch: IInputFetchHandler;   // (value, cb) => void
  onChange: IInputValueHandler;  // (newValue) => void
  disabled: boolean;
}

interface IAutocompleteState {
  suggestions: string[];
}

export default class AutocompleteInput extends React.Component<IAutocompleteProps, IAutocompleteState> {
  private fetchTimer: number | undefined;

  constructor(props: IAutocompleteProps) {
    super(props);
    this.state = { suggestions: [] };
  }

  componentDidUpdate(prevProps: IAutocompleteProps) {
    // Se o campo for desabilitado ou o valor for limpo, limpe as sugestões
    if ((prevProps.disabled === false && this.props.disabled === true) ||
        (prevProps.value !== this.props.value && (this.props.value ?? '').trim() === '')) {
      this.clearSuggestions();
    }
  }

  componentWillUnmount(): void {
    this.clearDebounce();
  }

  private clearDebounce = () => {
    if (this.fetchTimer) {
      window.clearTimeout(this.fetchTimer);
      this.fetchTimer = undefined;
    }
  };

  private clearSuggestions = () => {
    this.setState({ suggestions: [] });
  };

  private getSuggestionValue = (suggestion: string) => suggestion;

  private renderSuggestion = (suggestion: string) => <span>{suggestion}</span>;

  private onSuggestionsFetchRequested = ({ value }: SuggestionsFetchRequestedParams) => {
    const trimmed = (value ?? '').trim();

    // Evita buscas quando: desabilitado, string pequena ou vazia
    if (this.props.disabled || trimmed.length < 3) {
      this.clearSuggestions();
      return;
    }

    // Debounce simples para reduzir chamadas
    this.clearDebounce();
    this.fetchTimer = window.setTimeout(() => {
      this.props.onFetch(trimmed, (data: string[] | null | undefined) => {
        this.setState({ suggestions: Array.isArray(data) ? data : [] });
      });
    }, 200);
  };

  private onSuggestionsClearRequested = () => {
    this.clearSuggestions();
  };

  private onChange = (_event: React.FormEvent<any>, { newValue }: ChangeEvent) => {
    this.props.onChange(newValue);
  };

  render() {
    const { suggestions } = this.state;
    const { value, label, disabled, name } = this.props;

    const inputProps = {
      placeholder: '',
      value,
      onChange: this.onChange,
      name,
      id: name,
      disabled,
      autoComplete: 'off' as const
    };

    const cssGroup = `form-group`;

    return (
      <div className={cssGroup}>
        <label className="col-sm-2 control-label">{label}</label>
        <div className={disabled ? 'disable-form-control col-sm-10' : 'col-sm-10'}>
          <Autosuggest
            suggestions={suggestions}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            shouldRenderSuggestions={(val: string) => !disabled && (val ?? '').trim().length >= 3}
            getSuggestionValue={this.getSuggestionValue}
            renderSuggestion={this.renderSuggestion}
            inputProps={inputProps}
            focusInputOnSuggestionClick={false}
          />
        </div>
      </div>
    );
  }
}