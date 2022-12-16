import { Component, CreateLinkInput } from '@atlassian/forge-graphql';
import { CompassYaml, PushEvent } from '../../types';
import { reportSyncError } from './report-sync-error';
import { transformRelationshipsFromYamlConfig, transformFieldsFromYamlConfig } from './yaml-config-transforms';
import validateConfigFile from './validate-config-file';
import { EXTERNAL_SOURCE, IMPORT_LABEL } from '../../constants';
import { createExternalAlias, getComponent, updateComponent } from '../../client/compass';
import { appendLink } from '../../utils/append-link';
import { getProjectLabels } from '../get-labels';
import { getProjectById } from '../../client/gitlab';

const getFileUrl = (filePath: string, event: PushEvent, branchName: string) => {
  return `${event.project.web_url}/blob/${branchName}/${filePath}`;
};

const shouldCreateExternalAlias = (projectId: string, component?: Component): boolean => {
  if (component) {
    const isAliasAlreadyExisted = component.externalAliases
      ? component.externalAliases.some(
          (alias) => alias.externalAliasId === projectId && alias.externalSource === EXTERNAL_SOURCE,
        )
      : false;

    return !component.dataManager && !isAliasAlreadyExisted;
  }

  return false;
};

export const syncComponent = async (
  token: string,
  componentYaml: CompassYaml,
  filePath: string,
  event: PushEvent,
  trackingBranch: string,
): Promise<void> => {
  const startTime = Date.now();
  const externalSourceURL = getFileUrl(filePath, event, trackingBranch);
  const { name, id: componentId, fields, description, ownerId, links, relationships } = componentYaml;
  let currentComponent: Component | null;

  console.log({ message: 'Syncing component with file', filePath, componentId });

  try {
    currentComponent = componentId ? await getComponent(componentId) : null;

    if (shouldCreateExternalAlias(event.project.id.toString(), currentComponent)) {
      await createExternalAlias({
        componentId,
        externalAlias: {
          externalId: event.project.id.toString(),
          externalSource: EXTERNAL_SOURCE,
        },
      });
    }

    validateConfigFile(componentYaml, currentComponent);

    const { topics } = await getProjectById(token, event.project.id);
    const projectLabels = await getProjectLabels(event.project.id, token, topics);

    const formattedLabels = projectLabels.map((label) => label.split(' ').join('-').toLowerCase());

    const labels = currentComponent?.labels
      ? [...currentComponent.labels, IMPORT_LABEL, ...formattedLabels]
      : [IMPORT_LABEL, ...formattedLabels];

    await updateComponent({
      id: componentId,
      name,
      fields: transformFieldsFromYamlConfig(fields),
      description: description || null,
      ownerId: ownerId || null,
      links: appendLink(event.project.web_url, links) as CreateLinkInput[],
      relationships: transformRelationshipsFromYamlConfig(relationships),
      dataManager: {
        externalSourceURL,
      },
      labels,
      currentComponent,
    });
  } catch (error) {
    console.warn({
      message: 'syncComponentWithFile failed at the 2nd stage',
      error,
      duration: Date.now() - startTime,
    });

    if (currentComponent) {
      await reportSyncError(error, componentId, externalSourceURL);
    }

    return;
  }

  console.log({
    message: 'syncComponentWithFile completed',
    duration: Date.now() - startTime,
  });
};
