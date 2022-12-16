import { ErrorTypes } from '../../resolverTypes';
import { ERROR_IMAGES } from '../EmptyState/errorImages';
import { GenericEmptyState } from '../EmptyState/GenericEmptyState';

type Props = {
  error?: ErrorTypes | null;
};

export const buildErrorState = ({ error }: Props): JSX.Element | undefined => {
  if (error) {
    return (
      <GenericEmptyState
        header='Cannot load your projects'
        image={ERROR_IMAGES.UNEXPECTED}
        description='Something went wrong while loading your projects. Please try again later.'
      />
    );
  }

  return undefined;
};
