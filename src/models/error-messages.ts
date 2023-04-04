function truncate(s: string): string {
  return s.toString().substring(0, 25);
}

function arrayToSentence(arr: Array<string>) {
  const joinedArray =
    arr.slice(0, -2).join('", "') + (arr.slice(0, -2).length ? '", "' : '') + arr.slice(-2).join('" and "');
  return `"${joinedArray}"`;
}

export const missingKeyErrorMessage = (missingKeys: Array<string>): string =>
  `${arrayToSentence(missingKeys)} must be included in the configuration file`;

export const missingNestedKeyErrorMessage = (missingKeys: Array<string>, topLevelProperty: string): string =>
  `the "${topLevelProperty}" property in the configuration file must include ${arrayToSentence(missingKeys)}`;

export function invalidKeyErrorMessage(propertyName: string, validProperties?: string[]): string {
  const truncatedPropertyName = truncate(propertyName);
  return validProperties && validProperties.length > 0
    ? `"${truncatedPropertyName}" must be one of the following keys: ${validProperties.join(', ')}`
    : `"${truncatedPropertyName}" is not a valid property`;
}

export const invalidCharactersErrorMessage = (key: string): string =>
  `"${key}" contains invalid characters. Remove those characters and try again.`;

export const maxValueLengthErrorMessage = (key: string, length: number): string =>
  `"${key}" field is too long. Try again with a value no longer than ${length} characters.`;

export const invalidValueTypeErrorMessage = (key: string, expectedType: string): string =>
  `"${key}" must be of type "${expectedType}"`;

export const invalidFieldTypeErrorMessage = (propertyName: string, validTypes: string[]): string =>
  `"${propertyName}" must have a value of: ${validTypes.join(', ')}`;

export const invalidLinkTypeErrorMessage = (type: string, validTypes: string[]): string =>
  `"${truncate(type)}" is not a valid link type. The accepted values are: ${validTypes.join(', ')}`;

export const DETACH_ERROR_MESSAGE =
  'Unexpected internal server error. You may need to relink the component and try deleting it again';

export const INVALID_RELATIONSHIP_ERROR_MESSAGE =
  'The Atlassian resource identifier (ARI) of the component at the start node of this relationship is invalid. Try again with a valid ARI';

export const DEFAULT_SERVER_ERROR_MESSAGE = 'Unexpected internal server error. Try again';

export const INVALID_YAML_ERROR = 'Invalid YAML format. Try again with a valid YAML file';

export const UNKNOWN_EXTERNAL_ALIAS_ERROR_MESSAGE =
  'We couldn’t find the external alias. Check for typos and try again.';
