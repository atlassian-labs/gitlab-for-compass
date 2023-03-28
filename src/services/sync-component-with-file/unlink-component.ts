import { EXTERNAL_SOURCE } from '../../constants';
import { deleteExternalAlias, detachDataManager } from '../../client/compass';
import { GraphqlGatewayError } from '../../models/errors';

export const unlinkComponent = async (componentId: string, repoId: string): Promise<void> => {
  console.log(`Unlinking component ${componentId}`);

  let errors: string[] = [];
  const startTimeDetachFile = Date.now();
  try {
    await detachDataManager({ componentId });
  } catch (error) {
    errors =
      error instanceof GraphqlGatewayError
        ? errors.concat(error.errors.map((e) => e.message))
        : errors.concat([error.message]);
  }

  try {
    await deleteExternalAlias({
      componentId,
      externalAlias: {
        externalId: repoId,
        externalSource: EXTERNAL_SOURCE,
      },
    });
  } catch (error) {
    errors =
      error instanceof GraphqlGatewayError
        ? errors.concat(error.errors.map((e) => e.message))
        : errors.concat([error.message]);
  }

  console.debug(`unlinkComponentFromFile took ${Date.now() - startTimeDetachFile} ms`);
  if (errors.length === 0) {
    return;
  }
  throw new Error(`Error unlinking component: ${errors.join(', ')}`);
};
