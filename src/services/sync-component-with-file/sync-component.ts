import { CompassLinkType, Component, ConfigFileMetadata } from '@atlassian/forge-graphql';
import yaml from 'js-yaml';
import { ComponentSyncDetails, ComponentSyncPayload, PushEvent } from '../../types';
import { reportSyncError } from './report-sync-error';
import { EXTERNAL_SOURCE } from '../../constants';
import { syncComponentWithFile, updateComponent } from '../../client/compass';
import { getProjectLabels } from '../get-labels';
import { getProjectById } from '../../client/gitlab';
import { hasLastSyncEvent } from '../../utils/push-event-utils';
import { mergeLabels } from '../../utils/labels-utils';

const getFileUrl = (filePath: string, event: PushEvent, branchName: string) => {
  return `${event.project.web_url}/blob/${branchName}/${filePath}`;
};

export const syncComponent = async (
  componentSyncPayload: ComponentSyncPayload,
  componentSyncDetails: ComponentSyncDetails,
  configFileMetadata: ConfigFileMetadata,
): Promise<void> => {
  const { token, event, trackingBranch, cloudId } = componentSyncDetails;
  const { componentYaml, absoluteFilePath } = componentSyncPayload;

  const startTime = Date.now();
  const externalSourceURL = getFileUrl(absoluteFilePath, event, trackingBranch);
  console.log({ message: 'Syncing component with file' });
  let currentComponent: Component | null;

  try {
    const data = await syncComponentWithFile({
      cloudId,
      configFile: yaml.dump(componentYaml),
      additionalExternalAliases: [{ externalId: event.project.id.toString(), externalSource: EXTERNAL_SOURCE }],
      externalSourceURL,
      additionalLinks: [
        {
          url: event.project.web_url,
          type: CompassLinkType.Repository,
        },
      ],
      configFileMetadata,
    });

    currentComponent = data.component;

    if (
      currentComponent.dataManager &&
      hasLastSyncEvent(currentComponent.dataManager) &&
      currentComponent.dataManager?.lastSyncEvent?.lastSyncErrors.length > 0
    ) {
      console.log({ message: `Main sync with file failed for component ${currentComponent.id}` });
      return;
    }

    console.log({ message: `Main sync with file success for component ${currentComponent.id}` });

    const { topics } = await getProjectById(token, event.project.id);
    const projectLabels = await getProjectLabels(event.project.id, token, topics);

    const labels = mergeLabels(projectLabels, currentComponent.labels);

    await updateComponent({
      currentComponent,
      id: currentComponent.id,
      labels,
    });
  } catch (error) {
    console.warn({
      message: 'syncComponentWithFile failed at the 2nd stage',
      error,
      duration: Date.now() - startTime,
    });

    if (currentComponent) {
      await reportSyncError(error, currentComponent.id, externalSourceURL);
    }

    return;
  }

  console.log({
    message: 'syncComponentWithFile completed',
    duration: Date.now() - startTime,
  });
};
