import { internalMetrics } from '@forge/metrics';
import { CallbackPayload } from './types';
import { serverResponse } from '../../utils/webtrigger-utils';

export const callback = (input: CallbackPayload) => {
  internalMetrics.counter('compass.github.dataProvider.start').incr();
  const { success, errorMessage } = input;

  if (success) {
    internalMetrics.counter('compass.github.dataProvider.end').incr();
  } else {
    internalMetrics.counter('compass.github.dataProvider.fail').incr();
  }

  if (!success) {
    console.error({
      message: 'Error processing dataProvider module',
      errorMessage,
    });
  }

  return serverResponse('Callback finished');
};
