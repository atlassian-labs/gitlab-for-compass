import { CompassComponentTypeObject } from '@atlassian/forge-graphql-types';
import { SelectOwnerTeamOption } from '../components/OwnerTeamSelect/types';
import { ErrorTypes, ProjectReadyForImport } from '../resolverTypes';

export type CompassComponentTypeOption = {
  label: string; // Name of the component
  value: string; // Component Type ID
};

export type ProjectImportSelection = ProjectReadyForImport & {
  isSelected: boolean;
  typeOption: CompassComponentTypeOption;
  ownerTeamOption: SelectOwnerTeamOption | null;
};

export type ComponentTypesResult = {
  componentTypesLoading: boolean;
  error: ErrorTypes | null | undefined;
  componentTypes: CompassComponentTypeObject[];
};
