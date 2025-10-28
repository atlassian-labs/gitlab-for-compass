import { getForgeAppId } from './get-forge-app-id';
import { MissingAppIdError } from '../models/errors';

describe('getForgeAppId', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clears the cache
    process.env = { ...originalEnv }; // Clone original env
  });

  afterEach(() => {
    process.env = originalEnv; // Restore original env
  });

  it('returns the FORGE_APP_ID from process.env', () => {
    process.env.FORGE_APP_ID = 'abc-123';
    expect(getForgeAppId()).toBe('abc-123');
  });

  it('throws MissingAppIdError if FORGE_APP_ID is not set', () => {
    delete process.env.FORGE_APP_ID;
    expect(() => getForgeAppId()).toThrow(MissingAppIdError);
  });

  it('throws MissingAppIdError if FORGE_APP_ID is empty string', () => {
    process.env.FORGE_APP_ID = '';
    expect(() => getForgeAppId()).toThrow(MissingAppIdError);
  });
});
