import { InvalidAriError } from '../models/errors';

export const parse = (ariString: string) => {
  if (!ariString) {
    throw new InvalidAriError(ariString);
  }
  const match = /^ari:cloud:([^:/]+):([^:/]*):([^:/]*)\/(.*)$/.exec(ariString);
  if (!match || match.length !== 5) {
    throw new InvalidAriError(ariString);
  }
  const terms = match.map((a) => (a && a.length > 0 ? a : undefined));
  const resourceOwner = terms[1];
  if (!resourceOwner) {
    throw new InvalidAriError(ariString);
  }
  return {
    resourceOwner,
    cloudId: terms[2],
    resourceType: terms[3],
    resourceId: terms[4],
  };
};
