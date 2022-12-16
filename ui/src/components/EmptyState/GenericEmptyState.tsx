import { FunctionComponent } from 'react';
import EmptyState from '@atlaskit/empty-state';

type Props = {
  header: string;
  description: string;
  image: string;
};

export const GenericEmptyState: FunctionComponent<Props> = ({ header, description, image }: Props) => {
  return (
    <EmptyState
      testId='empty-state'
      header={header}
      description={description}
      imageUrl={image}
      maxImageHeight={120}
      maxImageWidth={140}
    />
  );
};
