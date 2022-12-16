import { CompassComponentType } from '@atlassian/forge-graphql/dist/src/graphql-types';

import { ProjectReadyForImport } from '../resolverTypes';

export type CompassComponentTypeOption = {
  label: string;
  value: CompassComponentType;
};

export type ProjectImportSelection = ProjectReadyForImport & {
  isSelected: boolean;
  type: CompassComponentTypeOption;
};
