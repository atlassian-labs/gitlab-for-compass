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

  // eslint-disable-next-line no-console
  console.log(`Performing preUninstall for site ${cloudId}`);

  const forgeAppId = getForgeAppId();

  try {
    const groupIds = await getGroupIds();

    const results = await Promise.allSettled(groupIds.map((groupId) => disconnectGroup(groupId, cloudId, forgeAppId)));
    if (hasRejections(results)) {
      throw new Error(`Error while disconnecting groups: ${getFormattedErrors(results)}`);
    }
  } catch (e) {
    console.error({ message: 'Error performing preUninstall', error: e });
  }
}
