import { unlinkCompassComponents } from '../client/compass';
import { deleteWebhook } from './webhooks';
import { deleteGroupDataFromStorage } from './clear-storage';

export const disconnectGroup = async (groupId: number, cloudId: string, forgeAppId: string): Promise<void> => {
  await unlinkCompassComponents(cloudId, `ari:cloud:ecosystem::app/${forgeAppId}`);
  await deleteWebhook(groupId);
  await deleteGroupDataFromStorage(groupId.toString());
};
