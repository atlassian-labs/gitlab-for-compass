import { ERROR_IMAGES } from './errorImages';
import { GenericEmptyState } from './GenericEmptyState';

type Props = {
  isProjectsExist: boolean;
  error?: string;
};

export const buildEmptyView = ({ isProjectsExist, error }: Props): JSX.Element | undefined => {
  if (error) {
    return (
      <GenericEmptyState
        header='Cannot load your projects'
        image={ERROR_IMAGES.UNEXPECTED}
        description='Something went wrong while loading your projects. Please try again later.'
      />
    );
  }

  return isProjectsExist ? (
    <GenericEmptyState
      header=''
      image={ERROR_IMAGES.NO_SEARCH_RESULTS}
      description="We couldn't find any projects matching your search."
    />
  ) : (
    <GenericEmptyState
      header="We couldn't find any projects"
      image={ERROR_IMAGES.NO_RESULTS}
      description='Check the group settings or refresh the page.'
    />
  );
};
