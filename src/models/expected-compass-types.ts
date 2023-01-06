// TODO: see how much of this file is replaceable by autogen types from the sdk

export const types = {
  OPTIONAL_STRING: 'optional:string',
  REQUIRED_STRING: 'required:string',
  REQUIRED_ARI: 'required:ari',
  OPTIONAL_OBJECT: 'optional:object',
  REQUIRED_OBJECT: 'required:object',
  REQUIRED_STRING_OR_NUMBER: 'required:string|number',
  OPTIONAL_STRING_OR_NUMBER: 'optional:string|number',
};

export function isRequired(type: string) {
  return type.split(':')[0] === 'required';
}

export function parseType(type: string) {
  return type.split(':')[1];
}

export const configKeyTypes = {
  id: types.REQUIRED_ARI,
  name: types.REQUIRED_STRING,
  description: types.OPTIONAL_STRING,
  ownerId: types.OPTIONAL_STRING,
  fields: types.OPTIONAL_OBJECT,
  links: types.OPTIONAL_OBJECT,
  relationships: types.OPTIONAL_OBJECT,
};

export const serviceConfigKeyTypes = {
  ...configKeyTypes,
  fields: types.REQUIRED_OBJECT,
};

export const fieldKeyTypes = {};

export const serviceFieldKeyTypes = {
  tier: types.REQUIRED_STRING_OR_NUMBER,
};

export const linkKeyTypes = {
  type: types.REQUIRED_STRING,
  url: types.REQUIRED_STRING,
  name: types.OPTIONAL_STRING,
};

export const relationshipKeyTypes = {
  DEPENDS_ON: types.OPTIONAL_OBJECT,
};

export const validFieldKeys = ['tier'];

export const validTierValues = ['1', '2', '3', '4'];

export const validLinkTypes = [
  'DOCUMENT',
  'CHAT_CHANNEL',
  'ON_CALL',
  'REPOSITORY',
  'PROJECT',
  'DASHBOARD',
  'OTHER_LINK',
];
