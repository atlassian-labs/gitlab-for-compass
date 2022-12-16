import { FunctionComponent } from 'react';

import SectionMessage from '@atlaskit/section-message';

import { ImportantText, SectionWrapper } from './styles';
import { ErrorTypes } from '../resolverTypes';

type Props = {
  errorType?: ErrorTypes;
};

export const DefaultErrorState: FunctionComponent<Props> = ({ errorType }) => {
  return (
    <SectionWrapper data-testid='error-state'>
      <SectionMessage title='Oops! Something went wrong.' appearance='error'>
        <ImportantText>{errorType}</ImportantText>
        <p>Please, try to reload a page.</p>
      </SectionMessage>
    </SectionWrapper>
  );
};
