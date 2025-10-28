import * as resolvers from './shared-resolvers';

jest.mock('../services/feature-flags', () => ({
  listFeatures: jest.fn(() => ({ featureA: true })),
}));
jest.mock('../services/group', () => ({
  getAllExistingGroups: jest.fn(() => Promise.resolve(['group1'])),
  getConnectedGroups: jest.fn(() => Promise.resolve(['group2'])),
  getTokenExpirationDays: jest.fn(() => Promise.resolve(7)),
}));
jest.mock('../services/webhooks', () => ({
  getWebhookSetupConfig: jest.fn(() => Promise.resolve({ webhookSetupInProgress: false })),
  getWebhookStatus: jest.fn(() => Promise.resolve('ENABLED')),
  setupAndValidateWebhook: jest.fn(() => Promise.resolve()),
}));
jest.mock('../utils/get-forge-app-id', () => ({
  getForgeAppId: jest.fn(() => 'app-id'),
}));
jest.mock('../services/fetch-projects', () => ({
  getGroupProjects: jest.fn(() => Promise.resolve({ projects: ['proj'], total: 1 })),
}));
jest.mock('../services/import-projects', () => ({
  getImportResult: jest.fn(() => Promise.resolve({ result: 'ok' })),
  importProjects: jest.fn(() => Promise.resolve()),
  ImportFailedError: class extends Error {},
}));
jest.mock('../client/compass', () => ({
  getAllComponentTypes: jest.fn(() => Promise.resolve(['type1'])),
}));
jest.mock('@forge/api', () => ({
  storage: {
    get: jest.fn(() => Promise.resolve('role')),
  },
}));

describe('resolvers tests', () => {
  it('getFeatures returns features', () => {
    expect(resolvers.getFeatures()).toEqual({ success: true, data: { featureA: true } });
  });

  it('groupsAllExisting returns groups', async () => {
    await expect(resolvers.groupsAllExisting()).resolves.toEqual({ success: true, data: ['group1'] });
  });

  it('connectedGroupsInfo returns connected groups', async () => {
    await expect(resolvers.connectedGroupsInfo()).resolves.toEqual({ success: true, data: ['group2'] });
  });

  it('appId returns app id', () => {
    expect(resolvers.appId()).toEqual({ success: true, data: 'app-id' });
  });

  it('webhookSetupConfig returns config', async () => {
    await expect(resolvers.webhookSetupConfig()).resolves.toEqual({
      success: true,
      data: { webhookSetupInProgress: false },
    });
  });

  it('getGroupsProjects returns projects', async () => {
    const req = {
      payload: { groupId: 1, page: 1, groupTokenId: 2, search: '', perPage: 10 },
      context: { cloudId: 'cloud' },
    };
    await expect(resolvers.getGroupsProjects(req)).resolves.toEqual({
      success: true,
      data: { projects: ['proj'], total: 1 },
    });
  });

  it('importProject returns success', async () => {
    const req = { payload: { projectsReadyToImport: [1], groupId: 2 }, context: { cloudId: 'cloud' } };
    await expect(resolvers.importProject(req)).resolves.toEqual({ success: true });
  });

  it('getAllComponentTypes returns types', async () => {
    const req = { context: { cloudId: 'cloud' }, payload: {} };
    await expect(resolvers.getAllComponentTypes(req)).resolves.toEqual({ success: true, data: ['type1'] });
  });

  it('getProjectImportResult returns result', async () => {
    await expect(resolvers.getProjectImportResult()).resolves.toEqual({ success: true, data: { result: 'ok' } });
  });

  it('getRole returns role', async () => {
    const req = { payload: { groupId: 1 }, context: {} };
    await expect(resolvers.getRole(req)).resolves.toEqual({ success: true, data: 'role' });
  });

  it('webhookStatus returns status', async () => {
    const req = { payload: { groupId: 1 }, context: {} };
    await expect(resolvers.webhookStatus(req)).resolves.toEqual({ success: true, data: 'ENABLED' });
  });

  it('tokenExpirationDays returns days', async () => {
    const req = { payload: { groupId: 1 }, context: {} };
    await expect(resolvers.tokenExpirationDays(req)).resolves.toEqual({ success: true, data: 7 });
  });
});
