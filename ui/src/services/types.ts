import { ErrorTypes, ProjectReadyForImport } from '../resolverTypes';

export type CompassComponentTypeOption = {
  label: string; // Name of the component
  value: string; // Component Type ID
};

export type ProjectImportSelection = ProjectReadyForImport & {
  isSelected: boolean;
  typeOption: CompassComponentTypeOption;
};

export type CompassComponentTypeId = {
  id: string;
};

export type ComponentTypesResult = {
  componentTypesLoading: boolean;
  error: ErrorTypes | null | undefined;
  componentTypes: CompassComponentTypeId[];
};
