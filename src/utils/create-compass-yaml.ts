import yaml from 'js-yaml';
import { Component } from '@atlassian/forge-graphql';
import { CompassYaml } from '../types';

export const generateCompassYamlData = (projectURL: string, component: Component): CompassYaml => {
  const { fields, name, description, ownerId, id: componentId, relationships } = component;

  const compassYMLFields = fields
    ? {
        tier: Number((fields['compass:tier'] as string[])[0]),
      }
    : {};

  return {
    name,
    id: componentId,
    description,
    ownerId,
    fields: compassYMLFields,
    links: [
      {
        type: 'REPOSITORY',
        name: null,
        url: projectURL,
      },
    ],
    relationships: {
      DEPENDS_ON: relationships ? relationships.map((relationship) => relationship.nodeId) : [],
    },
  };
};

export const createCompassYml = (compassYamlData: CompassYaml): string => {
  const compassYML = yaml.dump(compassYamlData, { lineWidth: -1, quotingType: "'" });

  return Buffer.from(compassYML).toString('base64');
};
