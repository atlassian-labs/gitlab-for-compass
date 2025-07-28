/* eslint-disable import/first */
import { mocked } from 'jest-mock';
import { storage, mockForgeApi, webTrigger } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { getGroupWebhook, registerGroupWebhook, deleteGroupWebhook } from '../client/gitlab';
import { deleteWebhook, getWebhookStatus, rotateWebhook, setupAndValidateWebhook } from './webhooks';
import { TEST_TOKEN } from '../__tests__/fixtures/gitlab-data';
import { GitLabRoles, WebhookAlertStatus } from '../types';
import { MOCK_GROUP_TOKEN } from '../resolvers/mocks';

jest.mock('../client/gitlab');
const mockGetGroupWebhook = mocked(getGroupWebhook);
const mockRegisterGroupWebhook = mocked(registerGroupWebhook);
const mockDeleteGroupWebhook = mocked(deleteGroupWebhook);

const MOCK_GROUP_ID = 123;
const MOCK_WEBHOOK_KEY = `webhook-id-${MOCK_GROUP_ID}`;
const MOCK_WEBHOOK_SIGNATURE_KEY = `webhook-sign-id-${MOCK_GROUP_ID}`;
const MOCK_WEBHOOK_SETUP_IN_PROGRESS_KEY = `webhook-setup-in-progress-${MOCK_GROUP_ID}`;
const MOCK_WEBHOOK_ID = 345;

const mockConsoleLog = jest.spyOn(console, 'log');

describe('setup webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with Owner token role', () => {
    it('returns existing webhook from storage', async () => {
      storage.get = jest.fn().mockReturnValueOnce(MOCK_WEBHOOK_ID).mockReturnValueOnce(GitLabRoles.OWNER);
      storage.getSecret = jest.fn().mockReturnValueOnce(TEST_TOKEN);
      mockGetGroupWebhook.mockResolvedValue({ id: 456, alert_status: WebhookAlertStatus.EXECUTABLE });

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
      mockGetGroupWebhook.mockResolvedValue({ id: 456, alert_status: WebhookAlertStatus.EXECUTABLE });

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

describe('rotate webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should rotate webhook', async () => {
    // delete webtrigger
    storage.get = jest.fn().mockResolvedValueOnce(GitLabRoles.OWNER); // tokenRole
    webTrigger.getUrl = jest.fn().mockReturnValue('https://example.com');
    webTrigger.deleteUrl.mockImplementationOnce(() => Promise.resolve());

    storage.delete = jest.fn().mockResolvedValueOnce(() => Promise.resolve());

    const MOCK_TOKEN = 'test-token';

    storage.get = jest
      .fn()
      .mockResolvedValueOnce(MOCK_WEBHOOK_ID) // webhookId
      .mockResolvedValueOnce(GitLabRoles.OWNER); // tokenRole
    storage.getSecret = jest.fn().mockResolvedValue(MOCK_TOKEN);

    mockDeleteGroupWebhook.mockImplementationOnce(() => Promise.resolve());
    // create webtrigger

    storage.get = jest.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(GitLabRoles.OWNER);
    storage.getSecret = jest.fn().mockReturnValueOnce(TEST_TOKEN);
    webTrigger.getUrl = jest.fn().mockReturnValue('https://example.com');
    mockRegisterGroupWebhook.mockResolvedValueOnce(MOCK_WEBHOOK_ID);

    await rotateWebhook(MOCK_GROUP_ID);
    expect(mockConsoleLog).toHaveBeenCalledWith('Finish rotating webhook');
  });

  it('should not rotate webhook if maintainer token role', async () => {
    storage.get = jest.fn().mockReturnValueOnce(GitLabRoles.MAINTAINER);

    await rotateWebhook(MOCK_GROUP_ID);

    expect(mockDeleteGroupWebhook).toBeCalledTimes(0);
    expect(mockRegisterGroupWebhook).toBeCalledTimes(0);
    expect(mockConsoleLog).toBeCalledWith('Skipping webhook rotation since the Maintainer token role');
  });
});

describe('get webhook status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return webhook EXECUTABLE status', async () => {
    storage.get = jest.fn().mockResolvedValueOnce(MOCK_WEBHOOK_ID); // webhookId
    storage.getSecret = jest.fn().mockResolvedValue(MOCK_GROUP_TOKEN); // groupToken

    mockGetGroupWebhook.mockResolvedValue({ id: 456, alert_status: WebhookAlertStatus.EXECUTABLE });

    const result = await getWebhookStatus(MOCK_GROUP_ID);
    expect(result).toEqual(WebhookAlertStatus.EXECUTABLE);
  });

  it('should return webhook DISABLED status', async () => {
    storage.get = jest.fn().mockResolvedValueOnce(MOCK_WEBHOOK_ID); // webhookId
    storage.getSecret = jest.fn().mockResolvedValue(MOCK_GROUP_TOKEN); // groupToken

    mockGetGroupWebhook.mockResolvedValue({ id: 456, alert_status: WebhookAlertStatus.DISABLED });

    const result = await getWebhookStatus(MOCK_GROUP_ID);
    expect(result).toEqual(WebhookAlertStatus.DISABLED);
  });

  it('should return webhook TEMPORARILY_DISABLED status', async () => {
    storage.get = jest.fn().mockResolvedValueOnce(MOCK_WEBHOOK_ID); // webhookId
    storage.getSecret = jest.fn().mockResolvedValue(MOCK_GROUP_TOKEN); // groupToken

    mockGetGroupWebhook.mockResolvedValue({ id: 456, alert_status: WebhookAlertStatus.TEMPORARILY_DISABLED });

    const result = await getWebhookStatus(MOCK_GROUP_ID);
    expect(result).toEqual(WebhookAlertStatus.TEMPORARILY_DISABLED);
  });
});
