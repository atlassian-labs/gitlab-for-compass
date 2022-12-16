import { MissingAppIdError } from '../models/errors';

export const getForgeAppId = (): string => {
  const forgeAppId = process.env.FORGE_APP_ID;
  if (!forgeAppId) {
    throw new MissingAppIdError();
  }

  return forgeAppId;
};
