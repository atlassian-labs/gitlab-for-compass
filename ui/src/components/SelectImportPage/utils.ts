import { ComponentTypesResult } from '../../services/types';

const TEMPLATE_COMPONENT_TYPE_ID = 'TEMPLATE';

export const getAvailableImportComponentTypes = (availableComponentTypes: ComponentTypesResult) => {
  const importableComponentTypes = availableComponentTypes;
  importableComponentTypes.componentTypes = availableComponentTypes.componentTypes?.filter(
    (componentTypeId) => componentTypeId.id !== TEMPLATE_COMPONENT_TYPE_ID,
  );
  return importableComponentTypes;
};
