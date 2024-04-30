/* eslint-disable import/order */
import { storage, mockForgeApi } from '../__tests__/helpers/forge-helper';
/* eslint-disable import/first */

mockForgeApi();

import { STORAGE_KEYS } from '../constants';
import { getTeamOnboarding, setTeamOnboarding } from './onboarding';

const accountId = 'test-account-id';

describe('getTeamOnboarding', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns true in case if onboarding is completed', async () => {
    storage.get.mockResolvedValue(true);

    const result = await getTeamOnboarding(accountId);

    expect(result).toEqual(true);
    expect(storage.get).toBeCalledWith(`${STORAGE_KEYS.TEAM_ONBOARDING}:${accountId}`);
  });

  it('returns false in case if onboarding is not completed', async () => {
    storage.get.mockResolvedValue(false);

    const result = await getTeamOnboarding(accountId);

    expect(result).toEqual(false);
    expect(storage.get).toBeCalledWith(`${STORAGE_KEYS.TEAM_ONBOARDING}:${accountId}`);
  });
});

describe('setTeamOnboarding', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('save to the storage onboarding value', async () => {
    await setTeamOnboarding(accountId);

    expect(storage.set).toBeCalledWith(`${STORAGE_KEYS.TEAM_ONBOARDING}:${accountId}`, true);
  });
});
