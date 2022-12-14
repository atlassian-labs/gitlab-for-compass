import { InvocationContext } from '../../types';
import { disconnectGroup } from '../../services/disconnect-group';
import { getForgeAppId } from '../../utils/get-forge-app-id';
import { getGroupIds } from '../../utils/storage-utils';

export default async function preUninstall(
  payload: Record<string, never>,
  { installContext }: InvocationContext,
): Promise<void> {
  console.log(`Performing preUninstall for site ${installContext}`);

  const cloudId = installContext.split('/')[1];
  const forgeAppId = getForgeAppId();
  const groupIds = await getGroupIds();

  try {
    await Promise.all(groupIds.map((groupId) => disconnectGroup(groupId, cloudId, forgeAppId)));
  } catch (e) {
    console.error({ message: 'Error performing preUninstall', error: e });
  }
}
