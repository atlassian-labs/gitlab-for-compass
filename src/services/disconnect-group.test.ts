import { disconnectGroup } from './disconnect-group';
import { unlinkCompassComponents } from '../client/compass';
import { deleteWebhook } from './webhooks';
import { deleteGroupDataFromStorage } from './clear-storage';

jest.mock('../client/compass', () => ({
  unlinkCompassComponents: jest.fn(),
}));
jest.mock('./webhooks', () => ({
  deleteWebhook: jest.fn(),
}));
jest.mock('./clear-storage', () => ({
  deleteGroupDataFromStorage: jest.fn(),
}));

describe('disconnectGroup', () => {
  const groupId = 123;
  const cloudId = 'cloud-abc';
  const forgeAppId = 'forge-xyz';

  beforeEach(() => {
    jest.clearAllMocks();
    (unlinkCompassComponents as jest.Mock).mockResolvedValue(undefined);
    (deleteWebhook as jest.Mock).mockResolvedValue(undefined);
    (deleteGroupDataFromStorage as jest.Mock).mockResolvedValue(undefined);
  });

  it('calls all dependencies with correct arguments', async () => {
    await disconnectGroup(groupId, cloudId, forgeAppId);

    expect(unlinkCompassComponents).toHaveBeenCalledWith(cloudId, `ari:cloud:ecosystem::app/${forgeAppId}`);
    expect(deleteWebhook).toHaveBeenCalledWith(groupId);
    expect(deleteGroupDataFromStorage).toHaveBeenCalledWith(groupId.toString());
  });

  it('throws if unlinkCompassComponents fails', async () => {
    (unlinkCompassComponents as jest.Mock).mockRejectedValue(new Error('unlink error'));
    await expect(disconnectGroup(groupId, cloudId, forgeAppId)).rejects.toThrow('unlink error');
    expect(deleteWebhook).not.toHaveBeenCalled();
    expect(deleteGroupDataFromStorage).not.toHaveBeenCalled();
  });

  it('throws if deleteWebhook fails', async () => {
    (deleteWebhook as jest.Mock).mockRejectedValue(new Error('webhook error'));
    await expect(disconnectGroup(groupId, cloudId, forgeAppId)).rejects.toThrow('webhook error');
    expect(deleteGroupDataFromStorage).not.toHaveBeenCalled();
  });

  it('throws if deleteGroupDataFromStorage fails', async () => {
    (deleteGroupDataFromStorage as jest.Mock).mockRejectedValue(new Error('storage error'));
    await expect(disconnectGroup(groupId, cloudId, forgeAppId)).rejects.toThrow('storage error');
  });
});
