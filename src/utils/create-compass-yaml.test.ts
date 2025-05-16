/* eslint-disable import/first, import/order */
import { mockForgeApi } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import {
  CompassLinkType,
  Component,
  CustomField,
  CustomFields,
  CustomFieldType,
  Link,
} from '@atlassian/forge-graphql-types';
import { CompassYaml, ImportableProject, YamlLink } from '../types';
import { formatLinks, generateCompassYamlData } from './create-compass-yaml';
import { DEFAULT_CONFIG_VERSION } from '../constants';
import * as featureFlags from '../services/feature-flags';

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

const getMockImportableProject = (override: Partial<ImportableProject> = {}): ImportableProject => {
  return {
    componentId: '123',
    componentLinks: [],
    typeId: 'SERVICE',
    ownerId: 'ownerId',
    isManaged: false,
    isCompassFilePrOpened: false,
    hasComponent: true,
    id: 123,
    description: '',
    name: 'name',
    url: '',
    labels: [],
    defaultBranch: 'main',
    groupName: 'group',
    groupPath: 'group/path',
    groupFullPath: 'group/full/path',
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
    const project = getMockImportableProject();

    const result = generateCompassYamlData(mockComponent, project);

    const expectedYamlData = getExpectedYamlData();

    expect(result).toEqual(expectedYamlData);
  });

  it('adds correct values of fields to the yaml data', () => {
    const mockFields = {
      'compass:tier': ['4'],
      'compass:lifecycle': ['Active'],
    };
    const mockComponent = getMockComponent({ fields: mockFields });
    const project = getMockImportableProject();

    const result = generateCompassYamlData(mockComponent, project);

    const expectedYamlData = getExpectedYamlData({ fields: { tier: 4, lifecycle: 'Active' } });

    expect(result).toEqual(expectedYamlData);
  });

  it('does not add empty value of field to the yaml data', () => {
    const mockFields = {
      'compass:tier': ['4'],
    };
    const mockComponent = getMockComponent({ fields: mockFields });
    const project = getMockImportableProject();

    const result = generateCompassYamlData(mockComponent, project);

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
    const project = getMockImportableProject();

    const result = generateCompassYamlData(mockComponent, project);

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
    const project = getMockImportableProject();

    const result = generateCompassYamlData(mockComponent, project);

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

describe('formatLinks', () => {
  const inputLinks: Array<YamlLink> = [
    { name: undefined, type: CompassLinkType.Repository, url: 'url1' },
    { name: 'Link 2', type: CompassLinkType.Document, url: 'url2' },
    { name: 'Link 3', type: CompassLinkType.Dashboard, url: 'url3' },
    { name: 'Link 4', type: CompassLinkType.Document, url: 'url4' },
  ];

  it('should filter out Document links and format remaining links correctly', async () => {
    jest.spyOn(featureFlags, 'listFeatures').mockReturnValueOnce({
      isDataComponentTypesEnabled: false,
      isSendStagingEventsEnabled: false,
      isDocumentComponentLinksDisabled: true,
      isGitlabMaintainerTokenEnabled: false,
      isImportAllEnabled: false,
      isCompassPushEventEnabled: false,
      isPackageDependenciesM3Enabled: false,
    });

    const result = formatLinks(inputLinks);

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      { type: CompassLinkType.Repository, url: 'url1' },
      { name: 'Link 3', type: CompassLinkType.Dashboard, url: 'url3' },
    ]);
  });

  it('should return an empty array if input links are null', async () => {
    jest.spyOn(featureFlags, 'listFeatures').mockReturnValueOnce({
      isDataComponentTypesEnabled: false,
      isSendStagingEventsEnabled: false,
      isDocumentComponentLinksDisabled: true,
      isGitlabMaintainerTokenEnabled: false,
      isImportAllEnabled: false,
      isCompassPushEventEnabled: false,
      isPackageDependenciesM3Enabled: false,
    });

    const result = formatLinks(null);

    expect(result).toEqual(null);
  });

  it('Should allow all types of Component Links if DISABLE_DOCUMENT_COMPONENT_LINKS FF is off', async () => {
    jest.spyOn(featureFlags, 'listFeatures').mockReturnValueOnce({
      isDataComponentTypesEnabled: false,
      isSendStagingEventsEnabled: false,
      isDocumentComponentLinksDisabled: false,
      isGitlabMaintainerTokenEnabled: false,
      isImportAllEnabled: false,
      isCompassPushEventEnabled: false,
      isPackageDependenciesM3Enabled: false,
    });

    const result = formatLinks(inputLinks);

    expect(result).toHaveLength(inputLinks.length);
    expect(result).toEqual(inputLinks);
  });
});
