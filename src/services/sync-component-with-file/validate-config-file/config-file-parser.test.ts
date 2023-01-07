/* eslint-disable import/first */
import { mockForgeApi } from '../../../__tests__/helpers/forge-helper';

mockForgeApi();
// eslint-disable-next-line import/order
import { CompassComponentType, CompassRelationshipType } from '@atlassian/forge-graphql';
import { YamlFields, YamlLink, YamlRelationships } from '../../../types';
import { types, relationshipKeyTypes } from '../../../models/expected-compass-types';

import ConfigFileParser from './config-file-parser';
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from '../../../constants';
import { TEST_COMPONENT_ID } from '../../../__tests__/fixtures/gitlab-data';

const BASE_CONFIG = {
  id: 'ari:cloud:compass:122345:component/12345/12345',
  name: 'Hello world',
};

const MOCK_OWNER_ID = 'ari:cloud:teams::team/12345';

describe('ConfigFileParser', () => {
  let serviceConfigFileParser: ConfigFileParser;
  let configFileParser: ConfigFileParser;

  beforeEach(() => {
    serviceConfigFileParser = new ConfigFileParser(CompassComponentType.Service);
    configFileParser = new ConfigFileParser(CompassComponentType.Other);
  });

  describe('Fields validators', () => {
    test('does not add error when non-service component has null fields', () => {
      const config = {
        ...BASE_CONFIG,
        fields: null as YamlFields,
      };

      configFileParser.validateConfig(config);
      expect(configFileParser.errors).toEqual([]);
    });

    test('does not add error when non-service component has empty fields', () => {
      const config = {
        ...BASE_CONFIG,
        fields: {},
      };

      configFileParser.validateConfig(config);
      expect(configFileParser.errors).toEqual([]);
    });

    test('does not add error when non-service component is missing fields', () => {
      configFileParser.validateConfig(BASE_CONFIG);
      expect(configFileParser.errors).toEqual([]);
    });

    test('adds error when non-service component defines a field', () => {
      const config = {
        ...BASE_CONFIG,
        fields: {
          tier: 3,
        },
      };

      configFileParser.validateConfig(config);
      expect(configFileParser.errors).toEqual(['"tier" is not a valid property']);
    });

    test('adds error if service component has no fields', () => {
      serviceConfigFileParser.validateConfig(BASE_CONFIG);
      expect(serviceConfigFileParser.errors).toEqual([
        '"fields" must be included in the configuration file',
        'the "fields" property in the configuration file must include "tier"',
      ]);
    });

    test('add no errors if service component has fields', () => {
      const config = {
        ...BASE_CONFIG,
        fields: {
          tier: '4',
        },
      };

      serviceConfigFileParser.validateConfig(config);
      expect(serviceConfigFileParser.errors).toEqual([]);
    });

    test("does not add error if field value isn't a string", () => {
      const fields = {
        tier: 4,
      };

      serviceConfigFileParser.validateFieldProperties(fields);
      expect(serviceConfigFileParser.errors).toEqual([]);
    });

    test('adds error if field key is unrecognized', () => {
      const fields = {
        someKey: 4,
      };

      configFileParser.validateFieldProperties(fields);
      expect(configFileParser.errors).toEqual(['"someKey" is not a valid property']);
    });

    test('truncates fields key if over string limit', () => {
      const fields = {
        Loremipsumdolorsitametconsectetur: 2,
      };

      configFileParser.validateFieldProperties(fields);
      expect(configFileParser.errors).toEqual(['"Loremipsumdolorsitametcon" is not a valid property']);
    });

    test("adds error when tier value isn't recognized", () => {
      const fields = {
        tier: 0,
      };

      serviceConfigFileParser.validateFieldProperties(fields);
      expect(serviceConfigFileParser.errors).toEqual(['"tier" must have a value of: 1, 2, 3, 4']);
    });

    test('adds error when component is service and fields is empty', () => {
      const fields = {};

      serviceConfigFileParser.validateFieldProperties(fields);
      expect(serviceConfigFileParser.errors).toEqual([
        'the "fields" property in the configuration file must include "tier"',
      ]);
    });

    test('adds error if field key is unrecognized in service component', () => {
      const fields = {
        someKey: 4,
      };

      serviceConfigFileParser.validateFieldProperties(fields);
      expect(serviceConfigFileParser.errors).toEqual([
        'the "fields" property in the configuration file must include "tier"',
        '"someKey" must be one of the following keys: tier',
      ]);
    });

    test('adds error if field key is unrecognized in service component', () => {
      const fields = {
        someKey: 4,
      };

      serviceConfigFileParser.validateFieldProperties(fields);
      expect(serviceConfigFileParser.errors).toEqual([
        'the "fields" property in the configuration file must include "tier"',
        '"someKey" must be one of the following keys: tier',
      ]);
    });
  });

  describe('validValueType', () => {
    test('does not add error when optional property is set to null', () => {
      const expectedType = types.OPTIONAL_STRING;

      configFileParser.validValueType(null, expectedType, 'name');
      expect(configFileParser.errors).toEqual([]);
    });

    test('does not add error when optional property is set to value with string type', () => {
      const expectedType = types.OPTIONAL_STRING;

      configFileParser.validValueType('hello world', expectedType, 'name');
      expect(configFileParser.errors).toEqual([]);
    });

    test('adds error when required property is set to null', () => {
      const expectedType = types.REQUIRED_STRING;

      configFileParser.validValueType(null, expectedType, 'name');
      expect(configFileParser.errors).toEqual(['"name" must be of type "string"']);
    });

    test('does not add error when required string is set to value with string type', () => {
      const expectedType = types.REQUIRED_STRING;

      configFileParser.validValueType('hello world', expectedType, 'name');
      expect(configFileParser.errors).toEqual([]);
    });

    test('adds error when links is not an array', () => {
      const config = {
        ...BASE_CONFIG,
        links: {},
      };

      configFileParser.validateConfig(config);
      expect(configFileParser.errors).toEqual(['"links" must be of type "array"']);
    });
  });

  describe('checkForMandatoryKeys', () => {
    test('adds error if key is mandatory', () => {
      const actualKeys = ['name'];
      const expectedObject = {
        id: types.REQUIRED_STRING,
      };

      configFileParser.checkForMandatoryKeys(actualKeys, expectedObject);
      expect(configFileParser.errors).toEqual(['"id" must be included in the configuration file']);
    });

    test('does not add error if key not is mandatory', () => {
      const actualKeys = ['name'];
      const expectedObject = {
        id: types.OPTIONAL_STRING,
      };

      configFileParser.checkForMandatoryKeys(actualKeys, expectedObject);
      expect(configFileParser.errors).toEqual([]);
    });
  });

  describe('checkIfKeyIsUnknown', () => {
    test('adds error if key is not expected', () => {
      const key = 'foo';
      const expectedKeys = ['id', 'description'];

      configFileParser.checkIfKeyIsUnknown(key, expectedKeys);
      expect(configFileParser.errors).toEqual(['"foo" is not a valid property']);
    });

    test('does not add error if key is expected', () => {
      const key = 'id';
      const expectedKeys = ['id', 'description'];

      configFileParser.checkIfKeyIsUnknown(key, expectedKeys);
      expect(configFileParser.errors).toEqual([]);
    });
  });

  describe('validateLinkProperties', () => {
    test('adds error if link entry is missing mandatory url', () => {
      const links = [
        {
          type: 'DOCUMENT',
        },
      ];

      configFileParser.validateLinkProperties(links);
      expect(configFileParser.errors).toEqual(['the "links" property in the configuration file must include "url"']);
    });

    test('adds error if link entry is missing mandatory type', () => {
      const links = [
        {
          url: 'https://atlassian.com',
        },
      ];

      configFileParser.validateLinkProperties(links);
      expect(configFileParser.errors).toEqual(['the "links" property in the configuration file must include "type"']);
    });

    test('adds error if link entry is missing mandatory url and type', () => {
      const links = [
        {
          name: 'Test link',
        },
      ];

      configFileParser.validateLinkProperties(links);
      expect(configFileParser.errors).toEqual([
        'the "links" property in the configuration file must include "type" and "url"',
      ]);
    });

    test('does not add error when all mandatory keys are defined', () => {
      const links = [
        {
          type: 'DOCUMENT',
          url: 'https://atlassian.com',
        },
      ];

      configFileParser.validateLinkProperties(links);
      expect(configFileParser.errors).toEqual([]);
    });

    test('does not add error when all known keys are defined', () => {
      const links = [
        {
          type: 'DOCUMENT',
          url: 'https://atlassian.com',
          name: 'Hello world',
        },
      ];

      configFileParser.validateLinkProperties(links);
      expect(configFileParser.errors).toEqual([]);
    });

    test('adds error when unexpected key is added to entry', () => {
      const links = [
        {
          type: 'DOCUMENT',
          url: 'https://atlassian.com',
          unknownKey: 1,
        },
      ];

      configFileParser.validateLinkProperties(links);
      expect(configFileParser.errors).toEqual(['"unknownKey" must be one of the following keys: type, url, name']);
    });

    describe('validate property types', () => {
      test('adds error when type is not formatted correctly', () => {
        const links = [
          {
            type: 1,
            url: 'https://atlassian.com',
          },
        ];

        configFileParser.validateLinkProperties(links);
        expect(configFileParser.errors).toEqual([
          '"1" is not a valid link type. The accepted values are: ' +
            'DOCUMENT, CHAT_CHANNEL, ON_CALL, REPOSITORY, PROJECT, DASHBOARD, OTHER_LINK',
        ]);
      });

      test('adds error when type is invalid', () => {
        const links = [
          {
            type: 'UNKNOWN_TYPE',
            url: 'https://atlassian.com',
          },
        ];

        configFileParser.validateLinkProperties(links);
        expect(configFileParser.errors).toEqual([
          '"UNKNOWN_TYPE" is not a valid link type. The accepted values are: ' +
            'DOCUMENT, CHAT_CHANNEL, ON_CALL, REPOSITORY, PROJECT, DASHBOARD, OTHER_LINK',
        ]);
      });

      test('truncates type when over string limit', () => {
        const links = [
          {
            type: 'Loremipsumdolorsitametconsectetur',
            url: 'https://atlassian.com',
          },
        ];

        configFileParser.validateLinkProperties(links);
        expect(configFileParser.errors).toEqual([
          '"Loremipsumdolorsitametcon" is not a valid link type. The accepted values are: ' +
            'DOCUMENT, CHAT_CHANNEL, ON_CALL, REPOSITORY, PROJECT, DASHBOARD, OTHER_LINK',
        ]);
      });

      test('adds error when url is not formatted correctly', () => {
        const links = [
          {
            type: 'DOCUMENT',
            url: {},
          },
        ];

        configFileParser.validateLinkProperties(links);
        expect(configFileParser.errors).toEqual(['"url" must be of type "string"']);
      });

      test('adds error when name is not formatted correctly', () => {
        const links = [
          {
            type: 'DOCUMENT',
            url: 'https://atlassian.com',
            name: 1,
          },
        ];

        configFileParser.validateLinkProperties(links);
        expect(configFileParser.errors).toEqual(['"name" must be of type "string"']);
      });

      test('does not add error when type is ON_CALL and component is a service', () => {
        const links = [
          {
            type: 'ON_CALL',
            url: 'https://atlassian.com',
          },
        ];

        serviceConfigFileParser.validateLinkProperties(links);
        expect(serviceConfigFileParser.errors).toEqual([]);
      });
    });
  });

  describe('validate relationship properties', () => {
    test('does not add error if relationships is missing DEPENDS_ON', () => {
      const relationships = {};

      configFileParser.validateTopLevelProperties(relationships, relationshipKeyTypes);
      expect(configFileParser.errors).toEqual([]);
    });

    test('does not add error if DEPENDS_ON exists', () => {
      const relationships = {
        DEPENDS_ON: [],
      } as YamlRelationships;

      configFileParser.validateTopLevelProperties(relationships, relationshipKeyTypes);
      expect(configFileParser.errors).toEqual([]);
    });

    test('adds error when unexpected key is added to relationships object', () => {
      const relationships = {
        DEPENDS_ON: [],
        unknownKey: {},
      } as YamlRelationships;

      configFileParser.validateTopLevelProperties(relationships, relationshipKeyTypes);
      expect(configFileParser.errors).toEqual(['"unknownKey" is not a valid property']);
    });

    test('adds error if DEPENDS_ON value is not an object', () => {
      const relationships = {
        DEPENDS_ON: 1,
      };

      configFileParser.validateTopLevelProperties(relationships, relationshipKeyTypes);
      expect(configFileParser.errors).toEqual(['"DEPENDS_ON" must be of type "object"']);
    });
  });

  describe('validateRelationshipsArray', () => {
    test('adds error if DEPENDS_ON value is not an object ', () => {
      configFileParser.validateRelationshipsArray(1 as unknown as string[], CompassRelationshipType.DependsOn);
      expect(configFileParser.errors).toEqual([]);
    });

    test("adds error if elements in DEPENDS_ON array aren't ARIs ", () => {
      const endNodes = ['string:that:is:not:an:ari'];

      configFileParser.validateRelationshipsArray(endNodes, CompassRelationshipType.DependsOn);
      expect(configFileParser.errors).toEqual(['"DEPENDS_ON elements" must be of type "ARI"']);
    });

    test('does not add error if elements in DEPENDS_ON array are ARIs ', () => {
      const endNodes = [TEST_COMPONENT_ID];

      configFileParser.validateRelationshipsArray(endNodes, CompassRelationshipType.DependsOn);
      expect(configFileParser.errors).toEqual([]);
    });

    test('does not add error if DEPENDS_ON is null', () => {
      configFileParser.validateRelationshipsArray(null, CompassRelationshipType.DependsOn);
      expect(configFileParser.errors).toEqual([]);
    });

    test('does not add error if DEPENDS_ON is empty', () => {
      configFileParser.validateRelationshipsArray([], CompassRelationshipType.DependsOn);
      expect(configFileParser.errors).toEqual([]);
    });
  });

  describe('validateConfig', () => {
    test('adds error when id is missing', () => {
      const config = {
        name: 'hello',
      };

      configFileParser.validateConfig(config);
      expect(configFileParser.errors).toEqual(['"id" must be included in the configuration file']);
    });

    test('adds error when name is missing', () => {
      const config = {
        id: BASE_CONFIG.id,
      };

      configFileParser.validateConfig(config);
      expect(configFileParser.errors).toEqual(['"name" must be included in the configuration file']);
    });

    test('adds multiple errors when there are multiple formatting problems', () => {
      const config = {
        name: 'hello',
      };

      serviceConfigFileParser.validateConfig(config);
      expect(serviceConfigFileParser.errors).toEqual([
        '"id" and "fields" must be included in the configuration file',
        'the "fields" property in the configuration file must include "tier"',
      ]);
    });

    test('adds error when unexpected key is added to config file', () => {
      const config = {
        ...BASE_CONFIG,
        unknownKey: '',
      };

      configFileParser.validateConfig(config);
      expect(configFileParser.errors).toEqual(['"unknownKey" is not a valid property']);
    });

    test('does not add error when all mandatory properties exist', () => {
      configFileParser.validateConfig(BASE_CONFIG);
      expect(configFileParser.errors).toEqual([]);
    });

    describe('validate property types', () => {
      test('adds error if id value is not an ari', () => {
        const config = {
          id: 'somestring',
          name: 'Hello world',
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual(['"id" must be of type "ARI"']);
      });

      test('adds error if name value is not a string', () => {
        const config = {
          ...BASE_CONFIG,
          name: {},
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual(['"name" must be of type "string"']);
      });

      test('does not add error if name value is max length', () => {
        const config = {
          ...BASE_CONFIG,
          name: 'a'.repeat(MAX_NAME_LENGTH),
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual([]);
      });

      test('adds error if name value is too long', () => {
        const config = {
          ...BASE_CONFIG,
          name: 'a'.repeat(MAX_NAME_LENGTH + 1),
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual([
          `"name" field is too long. Try again with a value no longer than ${MAX_NAME_LENGTH} characters.`,
        ]);
      });

      test('adds error if name value is blank', () => {
        const config = {
          ...BASE_CONFIG,
          name: '     ',
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual(['"name" cannot be empty string.']);
      });

      test('adds error if description value is not a string', () => {
        const config = {
          ...BASE_CONFIG,
          description: 1,
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual(['"description" must be of type "string"']);
      });

      test('does not add error if description value is max length', () => {
        const config = {
          ...BASE_CONFIG,
          description: 'a'.repeat(MAX_DESCRIPTION_LENGTH),
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual([]);
      });

      test('adds error if description value is too long', () => {
        const config = {
          ...BASE_CONFIG,
          description: 'a'.repeat(MAX_DESCRIPTION_LENGTH + 1),
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual([
          `"description" field is too long. Try again with a value no longer than ${MAX_DESCRIPTION_LENGTH} characters.`,
        ]);
      });

      test('adds error if ownerId value is not a string', () => {
        const config = {
          ...BASE_CONFIG,
          ownerId: {},
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual(['"ownerId" must be of type "string"']);
      });

      test('adds error if fields value is not an object', () => {
        const config = {
          ...BASE_CONFIG,
          fields: 'invalid field string',
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual(['"fields" must be of type "object"']);
      });

      test('adds error if fields value is not an object and does not include tier', () => {
        const config = {
          ...BASE_CONFIG,
          fields: 'invalid field string',
        };

        serviceConfigFileParser.validateConfig(config);
        expect(serviceConfigFileParser.errors).toEqual([
          '"fields" must be of type "object"',
          'the "fields" property in the configuration file must include "tier"',
        ]);
      });

      test('adds error if fields value is an array', () => {
        const config = {
          ...BASE_CONFIG,
          fields: ['tier'],
        };

        serviceConfigFileParser.validateConfig(config);
        expect(serviceConfigFileParser.errors).toEqual([
          '"fields" must be of type "object"',
          'the "fields" property in the configuration file must include "tier"',
        ]);
      });

      test('adds error if links value is not an object', () => {
        const config = {
          ...BASE_CONFIG,
          links: 1,
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual(['"links" must be of type "object"']);
      });

      test('does not add error if all types are valid', () => {
        const config = {
          ...BASE_CONFIG,
          description: 'Test component',
          ownerId: MOCK_OWNER_ID,
          fields: [] as YamlFields,
          links: [] as YamlLink[],
          relationships: [] as YamlRelationships,
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual([]);
      });

      test('does not add error if optional property is null', () => {
        const config = {
          ...BASE_CONFIG,
          links: null as YamlLink,
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual([]);
      });

      test('adds error if relationships value is not an object', () => {
        const config = {
          ...BASE_CONFIG,
          relationships: 'invalid relationships string',
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual(['"relationships" must be of type "object"']);
      });

      test('adds error if relationships value is an array', () => {
        const config = {
          ...BASE_CONFIG,
          relationships: ['test'],
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual(['"relationships" must be of type "object"']);
      });

      test('does not add error if all types are valid', () => {
        const config: any = {
          ...BASE_CONFIG,
          description: 'Test component',
          ownerId: MOCK_OWNER_ID,
          fields: [],
          links: [],
          relationships: [],
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual([]);
      });

      test('does not add error if optional property is null', () => {
        const config: any = {
          ...BASE_CONFIG,
          description: 'Test component',
          fields: null,
          links: [],
          relationships: [],
        };

        configFileParser.validateConfig(config);
        expect(configFileParser.errors).toEqual([]);
      });
    });
  });
});
