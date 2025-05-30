import {
  CompassLinkType,
  CompassCreateEventInput,
  Component,
  ComponentPayload,
  DeleteCompassComponentExternalAliasInput,
  DetachCompassComponentDataManagerInput,
  GetComponentByExternalAliasInput,
  UpdateCompassComponentDataManagerMetadataInput,
  UpdateComponentInput,
  SdkError,
  SyncComponentWithFileInput,
  CompassComponentTypeObject,
  GetComponentInput,
  UnLinkComponentInput,
  CompassResyncRepoFilesInput,
} from '@atlassian/forge-graphql-types';
import graphqlGateway from '@atlassian/forge-graphql';
import { ImportableProject, COMPASS_GATEWAY_MESSAGES, Metric, Team } from '../types';
import { EXTERNAL_SOURCE, IMPORT_LABEL, MAX_LABELS_LENGTH } from '../constants';
import { UNKNOWN_EXTERNAL_ALIAS_ERROR_MESSAGE } from '../models/error-messages';
import { AggClientError, GraphqlGatewayError } from '../models/errors';
import { getTenantContextQuery } from './get-tenat-context-query';
import { aggQuery } from './agg';
import { getTeamsQuery } from './get-teams-query';
import { formatLabels } from '../utils/labels-utils';
import { convertToCompassSlug } from '../utils/component-slug';

const throwIfErrors = function throwIfSdkErrors(method: string, errors: SdkError[]) {
  // Checking if any invalid config errors to report.
  // Certain client errors cannot be validated before calling the compass API, but should be raised as user errors.
  const clientErrors = errors.filter((e) => e?.statusCode === 400);
  if (clientErrors.length > 0) {
    console.warn({ message: 'invalid request error', method, errors: clientErrors.map((e) => e.message) });
    throw new AggClientError(clientErrors.map((e) => e.message));
  }
  if (errors.length > 0) {
    console.warn({ message: 'GraphqlGateway request error', method, errors: errors.map((e) => e.message) });
    throw new GraphqlGatewayError(method, errors);
  }
};

export const createComponent = async (cloudId: string, project: ImportableProject): Promise<Component | never> => {
  const { name, description, typeId, labels, url, ownerId } = project;
  const formattedLabels = formatLabels(labels).slice(0, MAX_LABELS_LENGTH - 1);
  const component = {
    name,
    description,
    typeId,
    labels: [IMPORT_LABEL, ...formattedLabels],
    links: [
      {
        type: CompassLinkType.Repository,
        url,
      },
    ],
    externalAlias: {
      externalId: project.id.toString(),
      externalSource: EXTERNAL_SOURCE,
    },
    cloudId,
    ownerId,
  };

  const { data, errors } = await graphqlGateway.compass.asApp().createComponent(component);

  throwIfErrors('createComponent', errors);

  return data.component;
};

// Slug creation could fail if it is a duplicate, so do it in a separate call from component creation
export const createComponentSlug = async (componentId: string, repoName: string): Promise<void> => {
  const slug = convertToCompassSlug(repoName);
  const input = {
    id: componentId,
    slug,
  };

  // Attempt 2 times to create a unique slug for this component, once with original slug and once with -1 appended
  for (let i = 1; i <= 2; i += 1) {
    try {
      const { errors } = await graphqlGateway.compass.asApp().updateComponent(input);
      if (!errors || errors.length === 0 || !errors[0].message.includes('Another component with the slug')) {
        return;
      }
      input.slug = `${slug}-${i.toString()}`;
    } catch (e) {
      console.error(`Error encountered while creating slug: ${e.message}`);
      break;
    }
  }
};

export async function updateComponent(input: UpdateComponentInput): Promise<Component | never> {
  const { data, errors } = await graphqlGateway.compass.asApp().updateComponent(input);

  throwIfErrors('updateComponent', errors);
  return data.component;
}

export async function updateDataManager(input: UpdateCompassComponentDataManagerMetadataInput): Promise<void | never> {
  const { errors } = await graphqlGateway.compass.asApp().updateDataManager(input);
  throwIfErrors('updateDataManager', errors);
}

export async function detachDataManager(input: DetachCompassComponentDataManagerInput): Promise<void | never> {
  const { errors } = await graphqlGateway.compass.asApp().detachDataManager(input);
  throwIfErrors('detachDataManager', errors);
}

export async function deleteExternalAlias(input: DeleteCompassComponentExternalAliasInput): Promise<void | never> {
  const { errors } = await graphqlGateway.compass.asApp().deleteExternalAlias(input);

  if (errors.length === 1 && errors[0].message === UNKNOWN_EXTERNAL_ALIAS_ERROR_MESSAGE) {
    console.log('Could not find external alias to delete.');
    return;
  }

  throwIfErrors('deleteExternalAlias', errors);
}

export async function unlinkCompassComponents(cloudId: string, ecosystemAppId: string): Promise<void | never> {
  const { errors } = await graphqlGateway.compass.asApp().unlinkExternalSource({
    cloudId,
    ecosystemAppId,
    externalSource: EXTERNAL_SOURCE,
  });

  throwIfErrors('unlinkExternalSource', errors);
}

export const unlinkComponentFromFile = async (input: UnLinkComponentInput): Promise<void> => {
  const { errors } = await graphqlGateway.compass.configAsCode.asApp().unlinkComponent(input);
  throwIfErrors('unlinkComponentFromFile', errors);
};

export async function getComponentByExternalAlias(input: GetComponentByExternalAliasInput): Promise<ComponentPayload> {
  const { errors, data } = await graphqlGateway.compass.asApp().getComponentByExternalAlias({ ...input });

  if (errors[0]?.message === COMPASS_GATEWAY_MESSAGES.COMPONENT_NOT_FOUND) {
    return { component: null };
  }

  throwIfErrors('getComponentByExternalAlias', errors);

  return data;
}

export async function sendEvents(eventPayload: CompassCreateEventInput | CompassCreateEventInput[]): Promise<void> {
  const { errors, data } = await graphqlGateway.compass.asApp().createEvent(eventPayload);

  throwIfErrors('createEvent', errors);

  return data;
}

export async function insertMetricValueByExternalId(cloudId: string, projectID: string, metric: Metric): Promise<void> {
  const { errors, data } = await graphqlGateway.compass.asApp().insertMetricValueByExternalId({
    cloudId,
    externalMetricSourceId: projectID,
    metricDefinitionId: metric.metricAri,
    value: {
      value: metric.value,
      timestamp: metric.timestamp ?? new Date().toISOString(),
    },
  });

  throwIfErrors('insertMetricValueByExternalId', errors);

  return data;
}

export async function syncComponentWithFile(eventPayload: SyncComponentWithFileInput): Promise<ComponentPayload> {
  const { errors, data } = await graphqlGateway.compass.configAsCode.asApp().syncComponentWithFile(eventPayload);

  throwIfErrors('syncComponentWithFile', errors);

  return data;
}

export async function getComponent(input: GetComponentInput): Promise<ComponentPayload> {
  const { errors, data } = await graphqlGateway.compass.asApp().getComponent({ ...input });

  if (errors[0]?.message === COMPASS_GATEWAY_MESSAGES.COMPONENT_NOT_FOUND) {
    return { component: null };
  }

  throwIfErrors('getComponent', errors);

  return data;
}

export const getAllComponentTypes = async (cloudId: string): Promise<CompassComponentTypeObject[]> => {
  const { data, errors } = await graphqlGateway.compass.asApp().getAllComponentTypes({ cloudId });
  throwIfErrors('getAllComponentTypes', errors);
  return data.componentTypes;
};

export const getTenantContext = async (cloudId: string) => {
  const tenantContextQuery = getTenantContextQuery(cloudId);
  const data = await aggQuery(tenantContextQuery);
  return data;
};

export const getTeams = async (
  orgId: string,
  cloudId: string,
  accountId?: string,
  searchValue?: string,
): Promise<Team[]> => {
  const organizationId = `ari:cloud:platform::org/${orgId}`;
  const teamsQuery = getTeamsQuery(organizationId, cloudId, accountId, searchValue);
  const data = await aggQuery(teamsQuery);
  return data.team.teamSearchV2.nodes;
};

export const resyncRepoFiles = async (input: CompassResyncRepoFilesInput) => {
  const { errors } = await graphqlGateway.compass.asApp().resyncRepoFiles(input);
  const clientErrors = errors.filter((e) => e?.statusCode === 400);
  if (clientErrors.length > 0) {
    console.error({
      message: 'invalid request error',
      method: 'resyncRepoFiles',
      errors: clientErrors.map((e) => e.message),
    });
  }
  if (errors.length > 0) {
    console.error({
      message: 'GraphqlGateway request error',
      method: 'resyncRepoFiles',
      errors: errors.map((e) => e.message),
    });
  }
};
