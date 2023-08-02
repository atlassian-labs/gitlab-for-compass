/* eslint-disable import/first */
import { mocked } from 'jest-mock';
import { storage, mockForgeApi, webTrigger } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { getGroupWebhook, registerGroupWebhook } from '../client/gitlab';
import { setupAndValidateWebhook } from './webhooks';
import { TEST_TOKEN } from '../__tests__/fixtures/gitlab-data';

jest.mock('../client/gitlab');
const mockGetGroupWebhook = mocked(getGroupWebhook);
const mockRegisterGroupWebhook = mocked(registerGroupWebhook);

const MOCK_GROUP_ID = 123;
const MOCK_WEBHOOK_KEY = `webhook-id-${MOCK_GROUP_ID}`;
const MOCK_WEBHOOK_SIGNATURE_KEY = `webhook-sign-id-${MOCK_GROUP_ID}`;
const MOCK_WEBHOOK_ID = 345;

describe('webhook service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns existing webhook from storage', async () => {
    storage.get = jest.fn().mockReturnValueOnce(MOCK_WEBHOOK_ID);
    storage.getSecret = jest.fn().mockReturnValueOnce(TEST_TOKEN);
    mockGetGroupWebhook.mockResolvedValue({ id: 456 });

    const result = await setupAndValidateWebhook(123);

    expect(storage.set).not.toHaveBeenCalled();
    expect(result).toBe(MOCK_WEBHOOK_ID);
  });

  it('setups new webhook', async () => {
    storage.get = jest.fn().mockReturnValueOnce(undefined);
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
    storage.get = jest.fn().mockReturnValueOnce(MOCK_WEBHOOK_KEY);
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
