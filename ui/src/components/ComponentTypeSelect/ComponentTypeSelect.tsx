import React, { PropsWithChildren } from 'react';

import Spinner from '@atlaskit/spinner';
import Select, { ActionMeta } from '@atlaskit/select';
import InlineMessage from '@atlaskit/inline-message';
import { CompassComponentTypeObject } from '@atlassian/forge-graphql';
import { Centered, ComponentTypeIconWrapper } from './styles';
import { CompassComponentTypeOption } from '../../services/types';
import { DEFAULT_COMPONENT_TYPE_ID } from '../../constants';
import { getComponentTypeOptionForBuiltInType } from '../utils';
import { LabelContainer, OptionContainer } from '../SelectImportPage/styles';
import { ComponentTypeIcon } from '../component-type-icon';

type ComponentTypeSelector = {
  loading: boolean;
  dropdownId: string;
  componentTypes?: CompassComponentTypeObject[];
  isDisabled?: boolean | undefined;
  onChange?:
    | ((value: CompassComponentTypeOption | null, action: ActionMeta<CompassComponentTypeOption>) => void)
    | undefined;
  selectedOption?: CompassComponentTypeOption | null;
};

const isComponentTypesEmpty = (componentTypes?: CompassComponentTypeObject[]): boolean => {
  return !componentTypes || componentTypes.length === 0;
};

const getComponentTypeIdItems = (componentTypes?: CompassComponentTypeObject[]): CompassComponentTypeOption[] => {
  if (!isComponentTypesEmpty(componentTypes)) {
    return (
      componentTypes?.map((componentTypeId) => {
        return getComponentTypeOptionForBuiltInType(componentTypeId?.id);
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

  const formatOptionLabel = ({ value }: { value: string }) => {
    const type = componentTypes?.find((t) => t.id === value);
    if (!type || !type.iconUrl) {
      return null;
    }

    return (
      <OptionContainer>
        <ComponentTypeIconWrapper>
          <ComponentTypeIcon name={type.name ?? type.id} iconUrl={type.iconUrl} />
        </ComponentTypeIconWrapper>
        <LabelContainer>{type.name}</LabelContainer>
      </OptionContainer>
    );
  };

  const componentTypeIdOptions = (componentTypes ?? []).map((t) => ({ label: t.name ?? '', value: t.id }));
  return (
    <Select
      classNamePrefix={'type-selector'}
      isDisabled={isDisabled}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
      formatOptionLabel={formatOptionLabel}
      key={dropdownId}
      value={selectedOption ?? getComponentTypeOptionForBuiltInType(DEFAULT_COMPONENT_TYPE_ID)}
      options={componentTypeIdOptions}
      onChange={onChange}
      menuPosition={'fixed'}
    />
  );
};
