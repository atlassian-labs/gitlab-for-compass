import { defaultMocks } from '../../helpers/mockHelpers';

export const filledMocks: {
  [key: string]: unknown;
} = {
  ...defaultMocks,
  groups: {
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

export const mocksWithError: {
  [key: string]: unknown;
} = {
  groups: {
    success: false,
    errors: [new Error('error')],
  },
};
