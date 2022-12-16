import { ComponentSyncEventStatus } from '@atlassian/forge-graphql';
import { updateDataManager } from '../../client/compass';

import { AggClientError, InvalidConfigFileError } from '../../models/errors';

const buildLastSyncEvent = (
  error: Error,
): {
  status: ComponentSyncEventStatus.ServerError | ComponentSyncEventStatus.UserError;
  lastSyncErrors: string[];
} => {
  if (error instanceof InvalidConfigFileError || error instanceof AggClientError) {
    return {
      status: ComponentSyncEventStatus.UserError,
      lastSyncErrors: error.errors,
    };
  }

  return {
    status: ComponentSyncEventStatus.ServerError,
    lastSyncErrors: [error.message],
  };
};

export const reportSyncError = async (error: Error, componentId: string, externalSourceURL: string): Promise<void> => {
  try {
    await updateDataManager({
      componentId,
      externalSourceURL,
      lastSyncEvent: buildLastSyncEvent(error),
    });
  } catch (e) {
    console.error({
      message: 'Error reporting sync error to data manager.',
      error: e,
    });
  }
};
