import { FunctionComponent, ReactNode } from 'react';
import Tooltip from '@atlaskit/tooltip';
import { Separator, TooltipDialog, TooltipWrapper } from './styles';

type Props = {
  title: string;
  description: string;
  children?: ReactNode;
};

export const TooltipGenerator: FunctionComponent<Props> = ({ title, description, children }) => (
  <Tooltip
    testId='repository-status-tooltip'
    component={TooltipDialog}
    content={
      <TooltipWrapper>
        <strong>{title}</strong>
        <Separator />
        {description}
      </TooltipWrapper>
    }
  >
    {children}
  </Tooltip>
);
