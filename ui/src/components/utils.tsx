import { CompassComponentType } from '@atlassian/forge-graphql/dist/src/graphql-types';
import EditorPanelIcon from '@atlaskit/icon/glyph/editor/panel';
import { CompassComponentTypeOption } from '../services/types';
import { StatusLabel } from './styles';

export const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

export const COMPONENT_TYPE_OPTIONS = [
  CompassComponentType.Service,
  CompassComponentType.Library,
  CompassComponentType.Application,
  CompassComponentType.Other,
].map((type) => {
  return {
    label: capitalize(type),
    value: type,
  };
});

export const getComponentTypeOption = (type?: CompassComponentType): CompassComponentTypeOption => {
  return COMPONENT_TYPE_OPTIONS.find(({ value }) => value === type) || COMPONENT_TYPE_OPTIONS[0];
};

export const tooltipsText = {
  managed: {
    title: 'Managed',
    description: 'Created and managed with a compass.yml configuration file in its repository',
    children: <StatusLabel data-testid='status-label-managed'>Managed</StatusLabel>,
  },
  inProgress: {
    title: 'In progress',
    description:
      'Created, but a pull request to add the compass.yml configuration file in' +
      ' its repository is pending approval and merge.',
    children: <StatusLabel data-testid='status-label-inprogress'>In progress</StatusLabel>,
  },
  created: {
    title: 'Created',
    description: 'Created but not managed with a compass.yml configuration file in its repository',
    children: <StatusLabel data-testid='status-label-created'>Created</StatusLabel>,
  },
  statusHeader: {
    title: 'Status',
    description: 'Import status showing whether the component already imported or is available for import',
    children: <EditorPanelIcon label='status-header-icon' />,
  },
};
