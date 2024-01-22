import yaml from 'js-yaml';
import { Component } from '@atlassian/forge-graphql';
import {
  CompassYaml,
  ComponentLifecycleField,
  ComponentTierField,
  ImportableProject,
  YamlFields,
  YamlLink,
} from '../types';
import { formatCustomFieldsToYamlFormat } from './format-custom-fields-to-yaml';
import { DEFAULT_CONFIG_VERSION } from '../constants';

function getFields(fields?: Record<string, unknown>): YamlFields | null {
  if (fields) {
    const tierField = fields['compass:tier'] as ComponentTierField;
    const lifecycleField = fields['compass:lifecycle'] as ComponentLifecycleField;

    const compassYMLFields = {
      ...(tierField ? { tier: tierField[0] ? Number(tierField[0]) : null } : {}),
      ...(lifecycleField ? { lifecycle: lifecycleField[0] || null } : {}),
    };

    return compassYMLFields;
  }

  return null;
}

function formatLink(link: YamlLink) {
  return {
    ...(link.name !== undefined ? { name: link.name } : {}),
    type: link.type,
    url: link.url,
  };
}

export const generateCompassYamlData = (component: Component, project: ImportableProject): CompassYaml => {
  const {
    fields,
    name,
    description,
    ownerId,
    id: componentId,
    relationships,
    typeId,
    type,
    links,
    labels,
    customFields,
  } = component;

  const { ownerId: selectedOwnerId } = project;

  return {
    name,
    id: componentId,
    description,
    configVersion: DEFAULT_CONFIG_VERSION,
    typeId: typeId || type,
    ownerId: ownerId || selectedOwnerId,
    fields: getFields(fields),
    links: links?.map(formatLink) || null,
    relationships: {
      DEPENDS_ON: relationships ? relationships.map((relationship) => relationship.nodeId) : [],
    },
    labels: labels || null,
    customFields: formatCustomFieldsToYamlFormat(customFields),
  };
};

export const createCompassYml = (compassYamlData: CompassYaml): string => {
  const compassYML = yaml.dump(compassYamlData, { lineWidth: -1, quotingType: "'" });

  return Buffer.from(compassYML).toString('base64');
};
