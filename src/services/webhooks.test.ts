/* eslint-disable import/first */
import { mocked } from 'jest-mock';
import { storage, mockForgeApi, webTrigger } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { getGroupWebhook, registerGroupWebhook, deleteGroupWebhook } from '../client/gitlab';
import { deleteWebhook, setupAndValidateWebhook } from './webhooks';
import { TEST_TOKEN } from '../__tests__/fixtures/gitlab-data';
import { GitLabRoles } from '../types';

jest.mock('../client/gitlab');
const mockGetGroupWebhook = mocked(getGroupWebhook);
const mockRegisterGroupWebhook = mocked(registerGroupWebhook);
const mockDeleteGroupWebhook = mocked(deleteGroupWebhook);

const MOCK_GROUP_ID = 123;
const MOCK_WEBHOOK_KEY = `webhook-id-${MOCK_GROUP_ID}`;
const MOCK_WEBHOOK_SIGNATURE_KEY = `webhook-sign-id-${MOCK_GROUP_ID}`;
const MOCK_WEBHOOK_SETUP_IN_PROGRESS_KEY = `webhook-setup-in-progress-${MOCK_GROUP_ID}`;
const MOCK_WEBHOOK_ID = 345;

describe('setup webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with Owner token role', () => {
    it('returns existing webhook from storage', async () => {
      storage.get = jest.fn().mockReturnValueOnce(MOCK_WEBHOOK_ID).mockReturnValueOnce(GitLabRoles.OWNER);
      storage.getSecret = jest.fn().mockReturnValueOnce(TEST_TOKEN);
      mockGetGroupWebhook.mockResolvedValue({ id: 456 });

      const result = await setupAndValidateWebhook(123);

      expect(storage.set).not.toHaveBeenCalled();
      expect(result).toBe(MOCK_WEBHOOK_ID);
    });

    it('setups new webhook', async () => {
      storage.get = jest.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(GitLabRoles.OWNER);
      storage.getSecret = jest.fn().mockReturnValueOnce(TEST_TOKEN);
      webTrigger.getUrl = jest.fn().mockReturnValue('https://example.com');
      mockRegisterGroupWebhook.mockResolvedValue(MOCK_WEBHOOK_ID);

      const result = await setupAndValidateWebhook(MOCK_GROUP_ID);

      expect(mockGetGroupWebhook).not.toHaveBeenCalled();
      expect(storage.set).toHaveBeenNthCalledWith(1, MOCK_WEBHOOK_KEY, MOCK_WEBHOOK_ID);
      expect(storage.set).toHaveBeenNthCalledWith(2, MOCK_WEBHOOK_SIGNATURE_KEY, expect.anything());
      expect(result).toBe(MOCK_WEBHOOK_ID);
    });

    it('uses owner token role to setup new webhook when no role is found in storage', async () => {
      storage.get = jest.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);
      storage.getSecret = jest.fn().mockReturnValueOnce(TEST_TOKEN);
      webTrigger.getUrl = jest.fn().mockReturnValue('https://example.com');
      mockRegisterGroupWebhook.mockResolvedValue(MOCK_WEBHOOK_ID);

      const result = await setupAndValidateWebhook(MOCK_GROUP_ID);

      expect(mockGetGroupWebhook).not.toHaveBeenCalled();
      expect(storage.set).toHaveBeenNthCalledWith(1, MOCK_WEBHOOK_KEY, MOCK_WEBHOOK_ID);
      expect(storage.set).toHaveBeenNthCalledWith(2, MOCK_WEBHOOK_SIGNATURE_KEY, expect.anything());
      expect(result).toBe(MOCK_WEBHOOK_ID);
    });

    it('setups new webhook in case of invalid webhook in storage', async () => {
      storage.get = jest.fn().mockReturnValueOnce(MOCK_WEBHOOK_KEY).mockReturnValueOnce(GitLabRoles.OWNER);
      storage.getSecret = jest.fn().mockReturnValueOnce(TEST_TOKEN);
      mockGetGroupWebhook.mockResolvedValue(null);
      webTrigger.getUrl = jest.fn().mockReturnValue('https://example.com');
      mockRegisterGroupWebhook.mockResolvedValue(MOCK_WEBHOOK_ID);

      const result = await setupAndValidateWebhook(MOCK_GROUP_ID);

      expect(storage.set).toHaveBeenNthCalledWith(1, MOCK_WEBHOOK_KEY, MOCK_WEBHOOK_ID);
      expect(storage.set).toHaveBeenNthCalledWith(2, MOCK_WEBHOOK_SIGNATURE_KEY, expect.anything());
      expect(result).toBe(MOCK_WEBHOOK_ID);
    });
  });

  describe('with Maintainer token role', () => {
    it('returns existing webhook from storage', async () => {
      storage.get = jest.fn().mockReturnValueOnce(MOCK_WEBHOOK_ID).mockReturnValueOnce(GitLabRoles.MAINTAINER);
      storage.getSecret = jest.fn().mockReturnValueOnce(TEST_TOKEN);
      mockGetGroupWebhook.mockResolvedValue({ id: 456 });

      const result = await setupAndValidateWebhook(MOCK_GROUP_ID);

      expect(mockGetGroupWebhook).not.toHaveBeenCalled();
      expect(mockRegisterGroupWebhook).not.toHaveBeenCalled();

      expect(storage.set).not.toHaveBeenCalled();
      expect(result).toBe(MOCK_WEBHOOK_ID);
    });

    it('setups new webhook', async () => {
      storage.get = jest.fn().mockReturnValueOnce(undefined).mockReturnValue(GitLabRoles.MAINTAINER);
      storage.getSecret = jest.fn().mockReturnValueOnce(TEST_TOKEN);

      const result = await setupAndValidateWebhook(MOCK_GROUP_ID, MOCK_WEBHOOK_ID, MOCK_WEBHOOK_SIGNATURE_KEY);

      expect(mockGetGroupWebhook).not.toHaveBeenCalled();
      expect(mockRegisterGroupWebhook).not.toHaveBeenCalled();
      expect(storage.set).toHaveBeenNthCalledWith(1, MOCK_WEBHOOK_KEY, MOCK_WEBHOOK_ID);
      expect(storage.set).toHaveBeenNthCalledWith(2, MOCK_WEBHOOK_SIGNATURE_KEY, expect.anything());
      expect(storage.delete).toHaveBeenNthCalledWith(1, MOCK_WEBHOOK_SETUP_IN_PROGRESS_KEY);
      expect(result).toBe(MOCK_WEBHOOK_ID);
    });
  });
});

describe('delete webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes webhook given owner token', async () => {
    const MOCK_TOKEN = 'test-token';

    storage.get = jest
      .fn()
      .mockResolvedValueOnce(MOCK_WEBHOOK_ID) // webhookId
      .mockResolvedValueOnce(GitLabRoles.OWNER); // tokenRole
    storage.getSecret = jest.fn().mockResolvedValue(MOCK_TOKEN);

    await deleteWebhook(MOCK_GROUP_ID);

    expect(deleteGroupWebhook).toHaveBeenCalledWith(MOCK_GROUP_ID, MOCK_WEBHOOK_ID, MOCK_TOKEN);
  });

  it('skips deleting webhook given maintainer token', async () => {
    const MOCK_TOKEN = 'test-token';

    storage.get = jest
      .fn()
      .mockResolvedValueOnce(MOCK_WEBHOOK_ID) // webhookId
      .mockResolvedValueOnce(GitLabRoles.MAINTAINER); // tokenRole
    storage.getSecret = jest.fn().mockResolvedValue(MOCK_TOKEN);

    await deleteWebhook(MOCK_GROUP_ID);

    expect(deleteGroupWebhook).not.toHaveBeenCalled();
  });
});
