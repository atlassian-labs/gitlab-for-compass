/* eslint-disable import/first, import/order */
import { mockForgeApi } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { CompassLinkType, Component, CustomField, CustomFields, CustomFieldType, Link } from '@atlassian/forge-graphql';
import { CompassYaml } from '../types';
import { generateCompassYamlData } from './create-compass-yaml';
import { DEFAULT_CONFIG_VERSION } from '../constants';

const getMockComponent = (override: Partial<Component> = {}): Component => {
  return {
    id: 'test',
    name: 'name',
    ownerId: 'ownerId',
    description: 'description',
    typeId: 'SERVICE',
    type: undefined,
    changeMetadata: {
      createdAt: '2023-03-22T12:17:37.175Z',
      lastUserModificationAt: '2023-03-22T12:17:38.420Z',
    },
    ...override,
  };
};

const getExpectedYamlData = (override: Partial<CompassYaml> = {}): CompassYaml => {
  return {
    id: 'test',
    name: 'name',
    description: 'description',
    ownerId: 'ownerId',
    typeId: 'SERVICE',
    fields: null,
    links: null,
    labels: null,
    configVersion: DEFAULT_CONFIG_VERSION,
    customFields: null,
    relationships: {
      DEPENDS_ON: [],
    },
    ...override,
  };
};

describe('generateCompassYamlData', () => {
  it('returns compass yaml data with empty values', () => {
    const mockComponent = getMockComponent();

    const result = generateCompassYamlData(mockComponent);

    const expectedYamlData = getExpectedYamlData();

    expect(result).toEqual(expectedYamlData);
  });

  it('adds correct values of fields to the yaml data', () => {
    const mockFields = {
      'compass:tier': ['4'],
      'compass:lifecycle': ['Active'],
    };
    const mockComponent = getMockComponent({ fields: mockFields });

    const result = generateCompassYamlData(mockComponent);

    const expectedYamlData = getExpectedYamlData({ fields: { tier: 4, lifecycle: 'Active' } });

    expect(result).toEqual(expectedYamlData);
  });

  it('does not add empty value of field to the yaml data', () => {
    const mockFields = {
      'compass:tier': ['4'],
    };
    const mockComponent = getMockComponent({ fields: mockFields });

    const result = generateCompassYamlData(mockComponent);

    expect(result).not.toHaveProperty('fields.lifecycle');
  });

  it('adds correct values of links to the yaml data', () => {
    const mockLinks: Link[] = [
      {
        id: '1',
        name: 'name',
        type: CompassLinkType.Repository,
        url: 'https://gitlab.com/test',
      },
      {
        id: '2',
        type: CompassLinkType.Repository,
        url: 'https://gitlab.com/test',
      },
    ];
    const mockComponent = getMockComponent({ links: mockLinks });

    const result = generateCompassYamlData(mockComponent);

    const expectedYamlData = getExpectedYamlData({
      links: [
        {
          name: mockLinks[0].name,
          type: mockLinks[0].type,
          url: mockLinks[0].url,
        },
        {
          type: mockLinks[1].type,
          url: mockLinks[1].url,
        },
      ],
    });

    expect(result).toEqual(expectedYamlData);
  });

  it('adds correct values of customFields to the yaml data', () => {
    const mockCustomFields: CustomFields = [
      {
        definition: {
          id: 'ari:cloud:compass:1',
          name: 'test1',
        },
        userIdValue: null,
      },
      {
        definition: {
          id: 'ari:cloud:compass:2',
          name: 'test2',
        },
        booleanValue: false,
      },
      {
        definition: {
          id: 'ari:cloud:compass:3',
          name: 'test3',
        },
        textValue: 'text',
      },
      {
        definition: {
          id: 'ari:cloud:compass:4',
          name: 'test4',
        },
        numberValue: 5,
      },

      {
        definition: {
          id: 'ari:cloud:compass:5',
          name: 'UNKNOWN TYPE',
        },
        unknownValue: { unknown: 'value' },
      } as CustomField,
    ];
    const mockComponent = getMockComponent({ customFields: mockCustomFields });

    const result = generateCompassYamlData(mockComponent);

    const expectedYamlData = getExpectedYamlData({
      customFields: [
        {
          name: 'test1',
          type: CustomFieldType.USER,
          value: null,
        },
        {
          name: 'test2',
          type: CustomFieldType.BOOLEAN,
          value: false,
        },
        {
          name: 'test3',
          type: CustomFieldType.TEXT,
          value: 'text',
        },
        {
          name: 'test4',
          type: CustomFieldType.NUMBER,
          value: 5,
        },
      ],
    });

    expect(result).toEqual(expectedYamlData);
  });
});
