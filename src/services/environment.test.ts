/* eslint-disable import/first, import/order */
import { mockAgg } from '../__tests__/helpers/mock-agg';

mockAgg();

import { EnvironmentTier } from '../types';
import { getEnvironmentTier } from './environment';
import { generateEnvironmentEvent } from '../__tests__/helpers/gitlab-helper';

const environmentName = 'production';
const ENVIRONMENTS_MOCK = [generateEnvironmentEvent()];

describe('Environment Service', () => {
  it('returns environment tier', async () => {
    const foundEnvironment = await getEnvironmentTier(ENVIRONMENTS_MOCK, environmentName);

    expect(foundEnvironment).toEqual(EnvironmentTier.PRODUCTION);
  });

  it('throws error in case when environment is not found', async () => {
    const invalidEnvironmentName = 'testing';
    const errorMsg = `Environment with name "${invalidEnvironmentName}" not found`;

    await expect(getEnvironmentTier(ENVIRONMENTS_MOCK, invalidEnvironmentName)).rejects.toThrow(new Error(errorMsg));
  });
});
