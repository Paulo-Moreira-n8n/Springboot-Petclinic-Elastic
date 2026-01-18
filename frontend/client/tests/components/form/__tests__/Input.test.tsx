
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { IConstraint, IError } from '../../../../src/types/index';
import Input from '../../../../src/components/form/Input';

describe('Input', () => {
  it('should render correctly without field error', () => {
    const error: IError = { fieldErrors: {} as any };
    const object = { myField: 'blabla' };
    const onChange = vi.fn();

    const { container } = render(
      <Input object={object} label="My Field" name="myField" error={error} onChange={onChange} />
    );

    // Label renderizada
    expect(screen.getByText('My Field')).toBeInTheDocument();

    // Valor inicial do input (Input usa defaultValue)
    const input = container.querySelector('input[name="myField"]') as HTMLInputElement;
    expect(input.value).toBe('blabla');

    // Sem erro
    expect(container.querySelector('.has-error')).toBeNull();

    // Change para novo valor
    fireEvent.change(input, { target: { value: 'My new value' } }); // fireEvent.change é o atalho para eventos de input. [12](https://testing-library.com/docs/dom-testing-library/api-events/)

    // Callback chamado
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).toBe('myField');        // name
    expect(onChange.mock.calls[0][1]).toBe('My new value');    // value
    expect(onChange.mock.calls[0][2]).toBeFalsy();             // error (sem constraint)
  });

  it('should render correctly with field error', () => {
    const error: IError = {
      fieldErrors: {
        myField: { field: 'myField', message: 'There was an error' }
      }
    } as any;

    const object = { myField: 'blabla' };
    const onChange = vi.fn();

    const { container } = render(
      <Input object={object} label="My Field" name="myField" error={error} onChange={onChange} />
    );

    // Label
    expect(screen.getByText('My Field')).toBeInTheDocument();

    // Valor
    const input = container.querySelector('input[name="myField"]') as HTMLInputElement;
    expect(input.value).toBe('blabla');

    // Com erro visual
    expect(container.querySelector('.has-error')).not.toBeNull();
    expect(screen.getByText('There was an error')).toBeInTheDocument();
  });

  it('should check constraints on input change', () => {
    const error: IError = { fieldErrors: {} as any };
    const object = { myField: 'blabla' };
    const onChange = vi.fn();

    const constraint: IConstraint = {
      message: 'Invalid',
      validate: vi.fn(() => true)
    };

    const { container } = render(
      <Input
        object={object}
        label="My Field"
        name="myField"
        error={error}
        onChange={onChange}
        constraint={constraint}
      />
    );

    const input = container.querySelector('input[name="myField"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'My new value' } });
    expect(constraint.validate).toHaveBeenCalledWith('My new value');
  });
});
