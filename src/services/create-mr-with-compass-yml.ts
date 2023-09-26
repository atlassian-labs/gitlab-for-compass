import { storage } from '@forge/api';

import { getComponent } from '../client/compass';
import { ImportableProject } from '../types';
import {
  COMMIT_MESSAGE,
  COMPASS_YML_BRANCH,
  MR_DESCRIPTION,
  MR_TITLE,
  STORAGE_KEYS,
  STORAGE_SECRETS,
} from '../constants';
import { getTrackingBranchName } from './get-tracking-branch';
import { createCompassYml, generateCompassYamlData } from '../utils/create-compass-yaml';
import { createFileInProject, createMergeRequest } from '../client/gitlab';

const FILE_PATH = 'compass.yml';
const ENCODING = 'base64';

export const createMRWithCompassYML = async (project: ImportableProject, componentId: string, groupId: number) => {
  const { id, defaultBranch } = project;

  const { component } = await getComponent({
    componentId,
    options: { includeCustomFields: true, includeLinks: true },
  });

  const baseUrl = await storage.get(STORAGE_KEYS.BASE_URL);
  const groupToken = await storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`);
  const trackingBranch = await getTrackingBranchName(baseUrl, groupToken, id, defaultBranch);
  const compassYamlData = generateCompassYamlData(component);

  const content = createCompassYml(compassYamlData);

  await createFileInProject(
    baseUrl,
    groupToken,
    id,
    FILE_PATH,
    COMPASS_YML_BRANCH,
    trackingBranch,
    ENCODING,
    content,
    COMMIT_MESSAGE,
  );

  await createMergeRequest(baseUrl, groupToken, id, COMPASS_YML_BRANCH, trackingBranch, MR_TITLE, MR_DESCRIPTION, true);
};
