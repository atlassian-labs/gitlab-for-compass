import { ConfigValidatorResult, ConfigValidatorResponse } from '@atlassian/forge-graphql';

import { getConnectedGroups } from '../../services/group';

export const configValidator = async (): Promise<ConfigValidatorResult> => {
  try {
    const connectedGroups = await getConnectedGroups();
    const appConfigured = connectedGroups && connectedGroups.length > 0;

    const response = new ConfigValidatorResponse(appConfigured);
    return response.build();
  } catch (e) {
    console.error('Could not determine installation state when invoking config validator');
    const response = new ConfigValidatorResponse(false);
    response.error = 'Could not determine installation state';
    return response.build();
  }
};
