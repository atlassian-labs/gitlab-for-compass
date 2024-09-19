import { getFormattedErrors, hasRejections } from '../../utils/promise-allsettled-helpers';
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

  try {
    const groupIds = await getGroupIds();

    const result = await Promise.allSettled(groupIds.map((groupId) => disconnectGroup(groupId, cloudId, forgeAppId)));
    if (hasRejections(result)) {
      throw new Error(`Error while disconnecting groups: ${getFormattedErrors(result)}`);
    }
  } catch (e) {
    console.error({ message: 'Error performing preUninstall', error: e });
  }
}
