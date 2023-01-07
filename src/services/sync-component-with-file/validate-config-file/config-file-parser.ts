import { CompassComponentType } from '@atlassian/forge-graphql';
import {
  emptyStringErrorMessage,
  invalidFieldTypeErrorMessage,
  invalidKeyErrorMessage,
  invalidLinkTypeErrorMessage,
  invalidValueTypeErrorMessage,
  maxValueLengthErrorMessage,
  missingKeyErrorMessage,
  missingNestedKeyErrorMessage,
} from '../../../models/error-messages';

import {
  configKeyTypes,
  fieldKeyTypes,
  isRequired,
  linkKeyTypes,
  parseType,
  relationshipKeyTypes,
  serviceConfigKeyTypes,
  serviceFieldKeyTypes,
  types,
  validLinkTypes,
  validTierValues,
} from '../../../models/expected-compass-types';
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from '../../../constants';
import { parse } from '../../../utils/parse-ari';

const unwrapPropertyKeys = (object: any, expectedObject: any): any => ({
  actualKeys: Object.keys(object),
  expectedKeys: Object.keys(expectedObject),
});

const isArray = (actualKeys: Array<string>): boolean => actualKeys.length > 0 && actualKeys[0] === '0';
export default class ConfigFileParser {
  public errors: Array<string>;

  private type: CompassComponentType;

  constructor(compassComponentType: CompassComponentType) {
    this.errors = [];
    this.type = compassComponentType;
  }

  validateConfig(config: any): void {
    const expectedObjectTypes = this.type === CompassComponentType.Service ? serviceConfigKeyTypes : configKeyTypes;
    this.validateTopLevelProperties(config, expectedObjectTypes);

    const validFields = config.fields && this.validValueType(config.fields, expectedObjectTypes.fields, 'fields');
    if (validFields) {
      this.validateFieldProperties(config.fields);
    } else if (this.type === CompassComponentType.Service) {
      this.addError(missingNestedKeyErrorMessage(['tier'], 'fields'));
    }
    const validLinks = config.links && this.validValueType(config.links, expectedObjectTypes.links, 'links');
    if (validLinks) {
      this.validateLinkProperties(config.links);
    }
    const validRelationships =
      config.relationships &&
      this.validValueType(config.relationships, expectedObjectTypes.relationships, 'relationships');
    if (validRelationships) {
      this.validateRelationshipProperties(config.relationships);
    }
  }

  validateTopLevelProperties(object: any, expectedObject: any): void {
    const { actualKeys, expectedKeys } = unwrapPropertyKeys(object, expectedObject);

    this.checkForMandatoryKeys(actualKeys, expectedObject);

    for (const key of actualKeys) {
      this.checkIfKeyIsUnknown(key, expectedKeys);
      if (!['fields', 'links', 'relationships'].includes(key)) {
        this.validValueType(object[key], expectedObject[key], key);
      }
    }
  }

  validateFieldProperties(fields: any): void {
    const expectedObject = this.type === CompassComponentType.Service ? serviceFieldKeyTypes : fieldKeyTypes;
    const { actualKeys, expectedKeys } = unwrapPropertyKeys(fields, expectedObject);

    if (isArray(actualKeys)) {
      this.addError(invalidValueTypeErrorMessage('fields', 'object'));
      if (this.type === CompassComponentType.Service) {
        this.addError(missingNestedKeyErrorMessage(['tier'], 'fields'));
      }
      return;
    }

    this.checkForMandatoryKeys(actualKeys, expectedObject, 'fields');
    this.checkForUnknownKeys(actualKeys, expectedKeys);

    for (const [key, value] of Object.entries(fields)) {
      this.checkFields(key, value);
    }
  }

  validateLinkProperties(links: any): void {
    if (links == null) {
      return;
    }

    if (!Array.isArray(links)) {
      this.addError(invalidValueTypeErrorMessage('links', 'array'));
      return;
    }

    for (const link of links) {
      this.checkLinkType(link.type);

      const actualKeys = Object.keys(link);
      this.checkForMandatoryKeys(actualKeys, linkKeyTypes, 'links');
      this.checkForUnknownLinkKeys(actualKeys, link);
    }
  }

  validateRelationshipProperties(relationships: any): void {
    const { actualKeys, expectedKeys } = unwrapPropertyKeys(relationships, relationshipKeyTypes);

    if (isArray(actualKeys)) {
      this.addError(invalidValueTypeErrorMessage('relationships', 'object'));
      return;
    }

    this.checkForMandatoryKeys(actualKeys, expectedKeys, 'relationships');
    this.checkForUnknownKeys(actualKeys, expectedKeys);

    for (const key of Object.keys(relationships)) {
      // Check that the relationship type is valid ie. DEPENDS_ON
      if (Object.keys(relationshipKeyTypes).includes(key)) {
        // Validate the array of ARIs
        const validRelationshipsArray = !this.validValueType(
          relationships[key],
          (relationshipKeyTypes as any)[key],
          key,
        );
        if (validRelationshipsArray) {
          this.validateRelationshipsArray(relationships, key);
        }
      }
    }
  }

  validateRelationshipsArray(endNodes: Array<string>, relationshipType: string): void {
    if (typeof endNodes !== 'object' || endNodes == null) {
      return;
    }

    endNodes.forEach((componentId) => {
      this.validValueType(componentId, types.REQUIRED_ARI, `${relationshipType} elements`);
    });
  }

  // CHECKS
  checkForMandatoryKeys(actualKeys: Array<string>, expectedObject: any, topLevelProperty?: string): void {
    // Check if there are keys that are required to exist in config file but do not
    const expectedKeys = Object.keys(expectedObject);
    const mandatoryKeys = expectedKeys.filter((key) => isRequired(expectedObject[key]));
    const missingKeys = [];
    for (const key of mandatoryKeys) {
      if (!actualKeys.includes(key)) {
        missingKeys.push(key);
      }
    }
    if (missingKeys.length > 0) {
      const errorMessage = topLevelProperty
        ? missingNestedKeyErrorMessage(missingKeys, topLevelProperty)
        : missingKeyErrorMessage(missingKeys);
      this.addError(errorMessage);
    }
  }

  checkForUnknownKeys(actualKeys: Array<string>, expectedKeys: Array<string>): void {
    for (const key of actualKeys) {
      this.checkIfKeyIsUnknown(key, expectedKeys, true);
    }
  }

  checkForUnknownLinkKeys(actualKeys: Array<string>, link: any): void {
    for (const key of actualKeys) {
      this.checkIfKeyIsUnknown(key, Object.keys(linkKeyTypes), true);
      if (key !== 'type') {
        this.validValueType(link[key], (linkKeyTypes as any)[key], key);
      }
    }
  }

  checkIfKeyIsUnknown(key: string, expectedKeys: Array<string>, nested = false): void {
    // Check if there are extra keys not defined in config file
    if (!expectedKeys.includes(key)) {
      const errorMessage = nested ? invalidKeyErrorMessage(key, expectedKeys) : invalidKeyErrorMessage(key);
      this.addError(errorMessage);
    }
  }

  validValueType(value: any, expectedType: string, key: string): boolean {
    let isValid = true;
    // checkIfKeyIsUnknown will catch this
    if (expectedType === undefined) {
      return isValid;
    }

    if (!isRequired(expectedType) && value == null) {
      return isValid;
    }

    if (expectedType === types.REQUIRED_ARI) {
      try {
        const { resourceId } = parse(value);
        const ids = resourceId.split('/');
        if (ids.length !== 2) {
          isValid = false;
          this.addError(invalidValueTypeErrorMessage(key, 'ARI'));
        }
      } catch (e) {
        isValid = false;
        this.addError(invalidValueTypeErrorMessage(key, 'ARI'));
      }
      return isValid;
    }

    const parsedExpectedTypes = parseType(expectedType).split('|');
    if (!parsedExpectedTypes.some((parsedExpectedType) => typeof value === parsedExpectedType)) {
      isValid = false;
      this.addError(invalidValueTypeErrorMessage(key, parsedExpectedTypes.join(', ')));
    }

    if (isValid && key === 'name') {
      if ((value as string).length > MAX_NAME_LENGTH) {
        isValid = false;
        this.addError(maxValueLengthErrorMessage(key, MAX_NAME_LENGTH));
      }
      if ((value as string).trim().length === 0) {
        isValid = false;
        this.addError(emptyStringErrorMessage(key));
      }
    }

    if (isValid && key === 'description' && (value as string).length > MAX_DESCRIPTION_LENGTH) {
      isValid = false;
      this.addError(maxValueLengthErrorMessage(key, MAX_DESCRIPTION_LENGTH));
    }

    return isValid;
  }

  checkFields(key: string, value: any): void {
    if (key === 'tier' && !validTierValues.includes(value.toString())) {
      this.addError(invalidFieldTypeErrorMessage('tier', validTierValues));
    }
  }

  checkLinkType(type: string): void {
    if (type == null) {
      return;
    }
    if (typeof type !== 'string' || !validLinkTypes.includes(type.toUpperCase())) {
      this.addError(invalidLinkTypeErrorMessage(type, validLinkTypes));
    }
  }

  addError(message: string): void {
    this.errors.push(message);
  }
}
