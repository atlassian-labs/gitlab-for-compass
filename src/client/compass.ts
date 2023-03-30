import graphqlGateway, {
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
} from '@atlassian/forge-graphql';
import { ImportableProject, COMPASS_GATEWAY_MESSAGES, Metric } from '../types';
import { EXTERNAL_SOURCE, IMPORT_LABEL } from '../constants';
import { UNKNOWN_EXTERNAL_ALIAS_ERROR_MESSAGE } from '../models/error-messages';
import { AggClientError, GraphqlGatewayError } from '../models/errors';

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
  const { name, description, typeId, labels, url } = project;
  const formattedLabels = labels.map((label) => label.split(' ').join('-').toLowerCase());
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
  };

  const { data, errors } = await graphqlGateway.compass.asApp().createComponent(component);

  throwIfErrors('createComponent', errors);

  return data.component;
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

export const getAllComponentTypeIds = async (cloudId: string): Promise<CompassComponentTypeObject[]> => {
  const { data, errors } = await graphqlGateway.compass.asApp().getAllComponentTypes({ cloudId });
  throwIfErrors('getAllComponentTypeIds', errors);
  return data.componentTypes;
};
