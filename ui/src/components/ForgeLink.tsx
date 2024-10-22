import { FunctionComponent, ReactNode } from 'react';

import { router } from '@forge/bridge';

type Props = {
  to: string;
  testId?: string;
  openInNewTab?: boolean;
  children: ReactNode;
};

export const ForgeLink: FunctionComponent<Props> = ({ to, testId, openInNewTab, children }) => (
  <a
    data-testid={testId}
    href={to}
    onClick={async (e) => {
      e.preventDefault();
      const nav = openInNewTab ? 'open' : 'navigate';
      await router[nav](to);
    }}
  >
    {children}
  </a>
);
