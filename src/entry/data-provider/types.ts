import { DataProviderBuildEvent, DataProviderDeploymentEvent } from '@atlassian/forge-graphql';

type DataProviderPayload = {
  url: string;
  ctx: {
    cloudId: string;
    extensionId: string;
  };
};

type CallbackPayload = {
  success: boolean;
  url: string;
  errorMessage?: string;
};

type BackfillData = {
  builds: DataProviderBuildEvent[];
  deployments: DataProviderDeploymentEvent[];
  metrics: {
    mrCycleTime: number;
    openMergeRequestsCount: number;
  };
};

export { DataProviderPayload, CallbackPayload, BackfillData };
