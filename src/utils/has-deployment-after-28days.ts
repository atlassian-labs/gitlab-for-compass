import { getProjectById } from '../client/gitlab';
import { getDateInThePast } from './time-utils';
import { DAYS_TO_CALC } from '../constants';
import { getDeploymentAfter28Days } from '../services/deployment';

export const hasDeploymentAfter28Days = async (
  projectId: number,
  baseUrl: string,
  groupToken: string,
): Promise<boolean> => {
  const dateBefore = getDateInThePast(DAYS_TO_CALC + 1);

  const { created_at: dateAfter } = await getProjectById(baseUrl, groupToken, projectId);
  const data = await getDeploymentAfter28Days(baseUrl, groupToken, projectId, dateAfter, dateBefore);

  return data.length > 0;
};
