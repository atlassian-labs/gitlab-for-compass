import { storage } from '@forge/api';
import { STORAGE_KEYS } from '../constants';

export const getTeamOnboarding = async (accountId: string): Promise<boolean> => {
  const isTeamOnboardingCompleted = await storage.get(`${STORAGE_KEYS.TEAM_ONBOARDING}:${accountId}`);

  if (!isTeamOnboardingCompleted) {
    return false;
  }

  return true;
};

export const setTeamOnboarding = async (accountId: string): Promise<void> => {
  await storage.set(`isTeamOnboardingCompleted:${accountId}`, true);
};
