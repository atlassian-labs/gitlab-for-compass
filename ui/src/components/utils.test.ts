import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { DEFAULT_COMPONENT_TYPE_ID } from '../constants';
import {
  capitalizeAndReplaceUnderscoresWithSpaces,
  getComponentTypeOptionForBuiltInType,
  getComponentTypeIdLabel,
  sleep,
  tooltipsText,
} from './utils';

describe('utils', () => {
  it('Capitalize: capitalize lowercase text', async () => {
    expect(capitalizeAndReplaceUnderscoresWithSpaces('test')).toBe('Test');
  });

  it('Capitalize: capitalize uppercase text', async () => {
    expect(capitalizeAndReplaceUnderscoresWithSpaces('TEST')).toBe('Test');
  });

  it('Capitalize: replace _ with a <-SPACE->', async () => {
    expect(capitalizeAndReplaceUnderscoresWithSpaces('MACHINE_LEARNING_MODEL')).toBe('Machine learning model');
  });

  it('Capitalize: empty string', async () => {
    expect(capitalizeAndReplaceUnderscoresWithSpaces('')).toBe('');
  });
});

describe('getComponentTypeOptionForBuiltInType', () => {
  it('returns correct label and value for provided typeId', () => {
    const typeId = 'custom-type';
    const result = getComponentTypeOptionForBuiltInType(typeId);

    expect(result).toEqual({
      label: getComponentTypeIdLabel(typeId),
      value: typeId,
    });
  });
  it('returns correct label and value for default typeId', () => {
    const result = getComponentTypeOptionForBuiltInType();

    expect(result).toEqual({
      label: getComponentTypeIdLabel(DEFAULT_COMPONENT_TYPE_ID),
      value: DEFAULT_COMPONENT_TYPE_ID,
    });
  });
});

describe('sleep', () => {
  it('resolves after the specified time', async () => {
    jest.useFakeTimers();
    const promise = sleep(1000);
    jest.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
    jest.useRealTimers();
  });
});

describe('tooltipsText', () => {
  it('has correct managed tooltip', () => {
    expect(tooltipsText.managed.title).toBe('Managed');
    expect(tooltipsText.managed.description).toContain('compass.yml');
    render(tooltipsText.managed.children as React.ReactElement);
    expect(screen.getByTestId('status-label-managed')).toHaveTextContent('Managed');
  });
  it('has correct inProgress tooltip', () => {
    expect(tooltipsText.inProgress.title).toBe('In progress');
    expect(tooltipsText.inProgress.description).toContain('pending approval');
    render(tooltipsText.inProgress.children as React.ReactElement);
    expect(screen.getByTestId('status-label-inprogress')).toHaveTextContent('In progress');
  });
  it('has correct created tooltip', () => {
    expect(tooltipsText.created.title).toBe('Created');
    expect(tooltipsText.created.description).toContain('not managed');
    render(tooltipsText.created.children as React.ReactElement);
    expect(screen.getByTestId('status-label-created')).toHaveTextContent('Created');
  });
});
