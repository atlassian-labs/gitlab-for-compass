import { view } from '@forge/bridge';
import {
  checkOnboardingRedirection,
  isRenderingInOnboardingFlow,
  ScmErrorType,
} from './onboarding-flow-context-helper';

jest.mock('@forge/bridge', () => ({
  view: {
    getContext: jest.fn(),
  },
}));

const mockGetCallBridge = jest.fn();

jest.mock('@forge/bridge/out/bridge', () => ({
  getCallBridge: () => mockGetCallBridge,
}));

describe('isRenderingInOnboardingFlow', () => {
  it('should return true when renderingLocation is set to onboarding flow', async () => {
    (view.getContext as jest.Mock).mockResolvedValue({
      extension: { renderingLocation: 'onboardingFlow' },
    });

    const result = await isRenderingInOnboardingFlow();
    expect(result).toBe(true);
  });

  it('should return false when renderingLocation is not set to onboarding flow', async () => {
    (view.getContext as jest.Mock).mockResolvedValue({
      extension: { renderingLocation: 'appConfigurationPage' },
    });

    const result = await isRenderingInOnboardingFlow();
    expect(result).toBe(false);
  });

  it('should return false when renderingLocation is set to empty string', async () => {
    (view.getContext as jest.Mock).mockResolvedValue({
      extension: { renderingLocation: '' },
    });

    const result = await isRenderingInOnboardingFlow();
    expect(result).toBe(false);
  });

  it('should return false when getContext throws an error', async () => {
    (view.getContext as jest.Mock).mockRejectedValue(new Error('Error fetching context'));

    const result = await isRenderingInOnboardingFlow();
    expect(result).toBe(false);
  });
});

describe('checkOnboardingRedirection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call getCallBridge with redirectOnboardingTube and empty params when in onboarding flow', async () => {
    (view.getContext as jest.Mock).mockResolvedValue({
      extension: { renderingLocation: 'onboardingFlow' },
    });

    await checkOnboardingRedirection();
    expect(mockGetCallBridge).toHaveBeenCalledWith('redirectOnboardingTube', { error: null, numComponents: null });
  });

  it('should call getCallBridge with redirectOnboardingTube and numComponents when in onboarding flow', async () => {
    (view.getContext as jest.Mock).mockResolvedValue({
      extension: { renderingLocation: 'onboardingFlow' },
    });
    const numComponents = 20;
    await checkOnboardingRedirection(undefined, numComponents);
    expect(mockGetCallBridge).toHaveBeenCalledWith('redirectOnboardingTube', {
      error: null,
      numComponents,
    });
  });

  it('should not call getCallBridge when not in onboarding flow', async () => {
    (view.getContext as jest.Mock).mockResolvedValue({
      extension: { renderingLocation: 'appConfigurationPage' },
    });

    await checkOnboardingRedirection();
    expect(mockGetCallBridge).not.toHaveBeenCalled();
  });

  it('should call getCallBridge with redirectOnboardingTube when in onboarding flow with import error', async () => {
    (view.getContext as jest.Mock).mockResolvedValue({
      extension: { renderingLocation: 'onboardingFlow' },
    });

    await checkOnboardingRedirection(ScmErrorType.IMPORT_ERROR);
    expect(mockGetCallBridge).toHaveBeenCalledWith('redirectOnboardingTube', {
      error: 'IMPORT_ERROR',
      numComponents: null,
    });
  });

  it('should not call getCallBridge when getContext throws an error', async () => {
    (view.getContext as jest.Mock).mockRejectedValue(new Error('Error fetching context'));

    await checkOnboardingRedirection();
    expect(mockGetCallBridge).not.toHaveBeenCalled();
  });
});

describe('ScmErrorType enum', () => {
  it('should have the correct keys and values', () => {
    const expectedEnum = { CONFIGURATION_ERROR: 'CONFIGURATION_ERROR', IMPORT_ERROR: 'IMPORT_ERROR', SKIP: 'SKIP' };
    expect(ScmErrorType).toEqual(expectedEnum);
  });

  it(
    'should not have additional keys. If you add enum values you must add them to frontend enum ' +
      'in addition to the other SCM apps',
    () => {
      const expectedEnumKeys = ['CONFIGURATION_ERROR', 'IMPORT_ERROR', 'SKIP'];
      expect(Object.keys(ScmErrorType)).toEqual(expectedEnumKeys);
    },
  );
});
