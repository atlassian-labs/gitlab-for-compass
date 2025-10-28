import { render, screen } from '@testing-library/react';
import { buildErrorState } from './buildErrorState';
import { ERROR_IMAGES } from '../EmptyState/errorImages';
import { ErrorTypes } from '../../resolverTypes';
import '@testing-library/jest-dom';

jest.mock('../EmptyState/GenericEmptyState', () => ({
  __esModule: true,
  GenericEmptyState: (props: any) => {
    return (
      <div data-testid='generic-empty-state'>
        <div>{props.header}</div>
        <div>{props.image}</div>
        <div>{props.description}</div>
      </div>
    );
  },
}));

describe('buildErrorState', () => {
  it('returns GenericEmptyState when error is provided', () => {
    const error = 'UNEXPECTED_ERROR' as ErrorTypes;
    const element = buildErrorState({ error });

    render(<>{element}</>);
    expect(screen.getByTestId('generic-empty-state')).toBeInTheDocument();
    expect(screen.getByText('Cannot load your projects')).toBeInTheDocument();
    expect(screen.getByText(ERROR_IMAGES.UNEXPECTED)).toBeInTheDocument();
    expect(
      screen.getByText('Something went wrong while loading your projects. Please try again later.'),
    ).toBeInTheDocument();
  });

  it('returns undefined when error is not provided', () => {
    expect(buildErrorState({ error: undefined })).toBeUndefined();
    expect(buildErrorState({ error: null })).toBeUndefined();
  });
});
