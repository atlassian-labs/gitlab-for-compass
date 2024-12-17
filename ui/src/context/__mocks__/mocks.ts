import { defaultMocks } from '../../helpers/mockHelpers';

export const filledMocks: {
  [key: string]: unknown;
} = {
  ...defaultMocks,
  'groups/connectedInfo': {
    success: true,
    data: [
      {
        full_name: 'koko',
        name: 'momo',
        id: '1',
      },
    ],
  },
};

export const webhookSetupInProgressMocks: {
  [key: string]: unknown;
} = {
  ...defaultMocks,
  'webhooks/setupConfig': {
    success: true,
    data: {
      webhookSetupInProgress: true,
      triggerUrl: 'https://test-url',
      groupId: 7788234,
    },
  },
};

export const mocksWithError: {
  [key: string]: unknown;
} = {
  groups: {
    success: false,
    errors: [new Error('error')],
  },
};
