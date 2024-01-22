import React, { FunctionComponent } from 'react';
import Avatar from '@atlaskit/avatar';
import { LabelWrapper, OptionWrapper, IconWrapper } from './styles';
import { SelectOwnerTeamOption } from './types';

export const OwnerTeamOption: FunctionComponent<SelectOwnerTeamOption> = ({ label, iconUrl }) => {
  return (
    <OptionWrapper data-testid={`owner-team-option`}>
      <IconWrapper>
        <Avatar appearance='circle' size='small' src={iconUrl} />
      </IconWrapper>
      <LabelWrapper>{label}</LabelWrapper>
    </OptionWrapper>
  );
};
