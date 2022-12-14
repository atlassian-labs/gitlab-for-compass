import { FunctionComponent } from 'react';
import { CompassComponentTypeOption } from '../../services/types';
import { ComponentTypeIcon } from '../component-type-icon';
import { LabelContainer, OptionContainer } from './styles';

export const FormatOptionLabel: FunctionComponent<CompassComponentTypeOption> = ({
  value,
  label,
}: CompassComponentTypeOption) => {
  return (
    <OptionContainer>
      <ComponentTypeIcon label={label} type={value} />
      <LabelContainer>{label}</LabelContainer>
    </OptionContainer>
  );
};
