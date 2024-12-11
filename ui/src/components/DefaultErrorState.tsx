import { FunctionComponent } from 'react';

import SectionMessage from '@atlaskit/section-message';

import { ImportantText, SectionWrapper } from './styles';
import { DefaultErrorTypes, ErrorTypes } from '../resolverTypes';
import { ErrorMessages } from '../errorMessages';

type Props = {
  errorType?: ErrorTypes;
};

export const DefaultErrorState: FunctionComponent<Props> = ({ errorType }) => {
  switch (errorType) {
    case DefaultErrorTypes.NO_APP_ID_VARIABLE_DEFINED:
      return (
        <SectionMessage
          testId='no-appid-message'
          appearance='error'
          title={ErrorMessages[DefaultErrorTypes.NO_APP_ID_VARIABLE_DEFINED].title}
        >
          <p>{ErrorMessages[DefaultErrorTypes.NO_APP_ID_VARIABLE_DEFINED].description}</p>
        </SectionMessage>
      );
    default:
      return (
        <SectionWrapper data-testid='error-state'>
          <SectionMessage title='Oops! Something went wrong.' appearance='error'>
            <ImportantText>{errorType}</ImportantText>
            <p>Please, try to reload a page.</p>
          </SectionMessage>
        </SectionWrapper>
      );
  }
};
