<<<<<<< HEAD
import { ConfigValidatorResponse } from '@atlassian/forge-graphql';
import { ConfigValidatorResult } from '@atlassian/forge-graphql-types';
=======
import { ConfigValidatorResult } from '@atlassian/forge-graphql-types';
import { ConfigValidatorResponse } from '@atlassian/forge-graphql';
>>>>>>> c2d0344 (COMPASS-25847 Resync repo files on push event, upgrade forge-graphql package version)

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
