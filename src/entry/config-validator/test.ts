/* eslint-disable import/first, import/order */
import { mockAgg } from '../../__tests__/helpers/mock-agg';

mockAgg();

import { configValidator } from './index';
import * as getConnectedGroups from '../../services/group';

const getConnectedGroupsSpy = jest.spyOn(getConnectedGroups, 'getConnectedGroups');

const MOCK_GROUP_DATA = {
  name: 'koko',
  id: 123,
  full_name: 'GitLab/koko',
  path: 'koko/momo',
};

describe('configValidator module', () => {
  it('successfully returns true when app is configured', async () => {
    getConnectedGroupsSpy.mockResolvedValue([MOCK_GROUP_DATA]);

    const result = await configValidator();

    expect(result.result.appConfigured).toBeTruthy();
  });

  it('successfully returns false when app is not configured', async () => {
    getConnectedGroupsSpy.mockResolvedValue([]);

    const result = await configValidator();

    expect(result.result.appConfigured).toBeFalsy();
  });
});
