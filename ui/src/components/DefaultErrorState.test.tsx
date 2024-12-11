import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { DefaultErrorTypes, ErrorTypes } from '../resolverTypes';
import { ErrorMessages } from '../errorMessages';
import { DefaultErrorState } from './DefaultErrorState';

describe('DefaultErrorState', () => {
  it('renders the correct message for NO_APP_ID_VARIABLE_DEFINED error type', () => {
    const { getByTestId, getByText } = render(
      <DefaultErrorState errorType={DefaultErrorTypes.NO_APP_ID_VARIABLE_DEFINED} />,
    );

    expect(getByTestId('no-appid-message')).toBeInTheDocument();
    expect(getByText(ErrorMessages[DefaultErrorTypes.NO_APP_ID_VARIABLE_DEFINED].title)).toBeInTheDocument();
    expect(getByText(ErrorMessages[DefaultErrorTypes.NO_APP_ID_VARIABLE_DEFINED].description)).toBeInTheDocument();
  });

  it('renders the default error message when no errorType is provided', () => {
    render(<DefaultErrorState />);

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText('Oops! Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText('Please, try to reload a page.')).toBeInTheDocument();
  });

  it('renders the errorType text when an unknown errorType is provided', () => {
    const unknownErrorType = 'UNKNOWN_ERROR';
    render(<DefaultErrorState errorType={unknownErrorType as any as ErrorTypes} />);

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText('Oops! Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText(unknownErrorType)).toBeInTheDocument();
    expect(screen.getByText('Please, try to reload a page.')).toBeInTheDocument();
  });
});
