import { EXTERNAL_ALIAS_SOURCE_IMMUTABLE_LOCAL_KEY, EXTERNAL_SOURCE } from '../../constants';
import { deleteExternalAlias, detachDataManager, getComponentByExternalAlias } from '../../client/compass';
import { GraphqlGatewayError } from '../../models/errors';
import { CompassYaml } from '../../types';

export const unlinkComponent = async (component: CompassYaml, repoId: string, cloudId: string): Promise<void> => {
  const { id, immutableLocalKey } = component;
  let componentToRemoveId: string = id;

  if (!component.id && component.immutableLocalKey) {
    const { component: foundComponent } = await getComponentByExternalAlias({
      cloudId,
      externalId: `${repoId}:${immutableLocalKey}`,
      externalSource: EXTERNAL_ALIAS_SOURCE_IMMUTABLE_LOCAL_KEY,
    });
    if (!foundComponent) {
      throw new Error(`Error unlinking component: no component found by immutableLocalKey: ${immutableLocalKey}`);
    }

    componentToRemoveId = foundComponent.id;
  }

  console.log(`Unlinking component ${componentToRemoveId}`);

  let errors: string[] = [];
  const startTimeDetachFile = Date.now();
  try {
    await detachDataManager({ componentId: componentToRemoveId });
  } catch (error) {
    errors =
      error instanceof GraphqlGatewayError
        ? errors.concat(error.errors.map((e) => e.message))
        : errors.concat([error.message]);
  }

  try {
    await deleteExternalAlias({
      componentId: componentToRemoveId,
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
