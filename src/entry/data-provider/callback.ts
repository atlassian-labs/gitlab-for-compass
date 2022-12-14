import { CallbackPayload } from './types';
import { serverResponse } from '../../utils/webtrigger-utils';

export const callback = (input: CallbackPayload) => {
  const { success, url, errorMessage } = input;

  if (!success) {
    console.error({
      message: 'Error processing dataProvider module',
      url,
      errorMessage,
    });
  }

  return serverResponse('Callback finished');
};
