import React, { PropsWithChildren } from 'react';

import Spinner from '@atlaskit/spinner';
import Select, { ActionMeta } from '@atlaskit/select';
import InlineMessage from '@atlaskit/inline-message';
import { Centered } from './styles';
import { CompassComponentTypeId, CompassComponentTypeOption } from '../../services/types';
import { FormatOptionLabel } from '../FormatOptionLabel';
import { DEFAULT_COMPONENT_TYPE_ID } from '../../constants';
import { getComponentTypeOption } from '../utils';

type ComponentTypeSelector = {
  loading: boolean;
  dropdownId: string;
  componentTypes?: CompassComponentTypeId[];
  isDisabled?: boolean | undefined;
  onChange?:
    | ((value: CompassComponentTypeOption | null, action: ActionMeta<CompassComponentTypeOption>) => void)
    | undefined;
  selectedOption?: CompassComponentTypeOption | null;
};

const isComponentTypesEmpty = (componentTypes?: CompassComponentTypeId[]): boolean => {
  return !componentTypes || componentTypes.length === 0;
};

const getComponentTypeIdItems = (componentTypes?: CompassComponentTypeId[]): CompassComponentTypeOption[] => {
  if (!isComponentTypesEmpty(componentTypes)) {
    return (
      componentTypes?.map((componentTypeId) => {
        return getComponentTypeOption(componentTypeId?.id);
      }) ?? []
    );
  }
  return [];
};

export const ComponentTypeSelect: React.FC<ComponentTypeSelector> = (
  props: PropsWithChildren<ComponentTypeSelector>,
) => {
  const { componentTypes, loading, dropdownId, isDisabled, onChange, selectedOption } = props;

  if (loading) {
    return <Spinner size={'small'} />;
  }

  if (isComponentTypesEmpty(componentTypes)) {
    return (
      <Centered>
        <InlineMessage
          testId='error-loading-component-types'
          appearance='error'
          iconLabel='Error loading component types'
        >
          <p>Error loading component types. Try refreshing!</p>
        </InlineMessage>
      </Centered>
    );
  }

  const componentTypeIdOptions = getComponentTypeIdItems(componentTypes);
  return (
    <Select
      classNamePrefix={'type-selector'}
      isDisabled={isDisabled}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
      formatOptionLabel={FormatOptionLabel}
      key={dropdownId}
      value={selectedOption ?? getComponentTypeOption(DEFAULT_COMPONENT_TYPE_ID)}
      options={componentTypeIdOptions}
      onChange={onChange}
      menuPosition={'fixed'}
    />
  );
};
