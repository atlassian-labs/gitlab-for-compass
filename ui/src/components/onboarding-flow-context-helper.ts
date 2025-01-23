import { view } from '@forge/bridge';
import { getCallBridge } from '@forge/bridge/out/bridge';

export async function isRenderingInOnboardingFlow(): Promise<boolean> {
  try {
    const context = await view.getContext();
    return context.extension.renderingLocation === 'onboardingFlow';
  } catch (error) {
    console.error('Error fetching onboarding flow context:', error);
    return false;
  }
}

export async function checkOnboardingRedirection(err?: string): Promise<void> {
  const isInOnboardingFlow = await isRenderingInOnboardingFlow();
  if (isInOnboardingFlow) {
    const params = err ? { error: err } : undefined;
    await getCallBridge()('redirectOnboardingTube', params);
  }
}
