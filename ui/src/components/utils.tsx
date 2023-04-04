import EditorPanelIcon from '@atlaskit/icon/glyph/editor/panel';
import { CompassComponentTypeOption } from '../services/types';
import { StatusLabel } from './styles';
import { DEFAULT_COMPONENT_TYPE_ID } from '../constants';
import { COMPONENT_TYPES } from './assets';

export const capitalize = (value: string): string =>
  (value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()).replaceAll('_', ' ');

export const getComponentTypeIdLabel = (typeId: string) => {
  return COMPONENT_TYPES.find((componentType) => componentType.id === typeId)?.label ?? capitalize(typeId);
};

export const getComponentTypeOption = (typeId?: string): CompassComponentTypeOption => {
  if (typeId) {
    return {
      label: getComponentTypeIdLabel(typeId),
      value: typeId,
    };
  }
  return getComponentTypeOption(DEFAULT_COMPONENT_TYPE_ID);
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
