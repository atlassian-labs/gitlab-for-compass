import { disconnectGroup } from '../../services/disconnect-group';
import { getForgeAppId } from '../../utils/get-forge-app-id';
import { getGroupIds } from '../../utils/storage-utils';

type PreUninstallPayload = {
  context: {
    cloudId: string;
  };
};

export default async function preUninstall(payload: PreUninstallPayload): Promise<void> {
  const { cloudId } = payload.context;

  console.log(`Performing preUninstall for site ${cloudId}`);

  const forgeAppId = getForgeAppId();
  const groupIds = await getGroupIds();

  try {
    await Promise.all(groupIds.map((groupId) => disconnectGroup(groupId, cloudId, forgeAppId)));
  } catch (e) {
    console.error({ message: 'Error performing preUninstall', error: e });
  }
}
