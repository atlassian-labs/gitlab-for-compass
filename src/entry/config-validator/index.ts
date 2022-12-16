import { ConfigValidatorResult, ConfigValidatorResponse } from '@atlassian/forge-graphql';

import { getConnectedGroups } from '../../services/group';

export const configValidator = async (): Promise<ConfigValidatorResult> => {
  const connectedGroups = await getConnectedGroups();
  const appConfigured = connectedGroups && connectedGroups.length > 0;

  const response = new ConfigValidatorResponse(appConfigured);
  return response.build();
};
