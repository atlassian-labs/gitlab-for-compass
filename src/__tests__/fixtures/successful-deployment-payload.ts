import { Deployment } from '../../types';

export const createMockDeployment = (daysFromNow: number, environment = 'production'): Deployment => ({
  id: 1,
  updated_at: new Date(new Date('2022-01-29T01:15:42.960Z').valueOf() - 1000 * 86400 * daysFromNow).toISOString(),
  created_at: '2021-12-08T17:10:12.034483Z',
  deployable: {
    status: 'success',
    finished_at: '2021-12-08T17:30:12.034483Z',
    pipeline: {
      id: 1,
      web_url: 'https://koko.momo',
    },
  },
  environment: {
    name: environment,
    id: 1,
  },
  status: 'success',
});
