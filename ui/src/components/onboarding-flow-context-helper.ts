import { view } from '@forge/bridge';
import { getCallBridge } from '@forge/bridge/out/bridge';

export enum ScmErrorType {
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  IMPORT_ERROR = 'IMPORT_ERROR',
  SKIP = 'SKIP',
}

export async function isRenderingInOnboardingFlow(): Promise<boolean> {
  try {
    const context = await view.getContext();
    return context.extension.renderingLocation === 'onboardingFlow';
  } catch (error) {
    console.error('Error fetching onboarding flow context:', error);
    return false;
  }
}

export async function checkOnboardingRedirection(err?: ScmErrorType, repoCount?: number): Promise<void> {
  const isInOnboardingFlow = await isRenderingInOnboardingFlow();
  if (isInOnboardingFlow) {
    await getCallBridge()('redirectOnboardingTube', { error: err ?? null, numComponents: repoCount ?? null });
  }
}
