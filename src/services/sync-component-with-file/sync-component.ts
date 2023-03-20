import { CompassLinkType, Component } from '@atlassian/forge-graphql';
import yaml from 'js-yaml';
import { CompassYaml, PushEvent } from '../../types';
import { reportSyncError } from './report-sync-error';
import { EXTERNAL_SOURCE, IMPORT_LABEL } from '../../constants';
import { syncComponentWithFile, updateComponent } from '../../client/compass';
import { getProjectLabels } from '../get-labels';
import { getProjectById } from '../../client/gitlab';

const getFileUrl = (filePath: string, event: PushEvent, branchName: string) => {
  return `${event.project.web_url}/blob/${branchName}/${filePath}`;
};

export const syncComponent = async (
  token: string,
  componentYaml: CompassYaml,
  filePath: string,
  event: PushEvent,
  trackingBranch: string,
  cloudId: string,
): Promise<void> => {
  const startTime = Date.now();
  const externalSourceURL = getFileUrl(filePath, event, trackingBranch);
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
    });
    currentComponent = data.component;
    console.log({ message: `Main sync with file success for component ${currentComponent.id}` });

    const { topics } = await getProjectById(token, event.project.id);
    const projectLabels = await getProjectLabels(event.project.id, token, topics);

    const formattedLabels = projectLabels.map((label) => label.split(' ').join('-').toLowerCase());

    const labels = currentComponent.labels
      ? [...currentComponent.labels, IMPORT_LABEL, ...formattedLabels]
      : [IMPORT_LABEL, ...formattedLabels];

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
