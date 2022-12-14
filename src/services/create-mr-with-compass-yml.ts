import { storage } from '@forge/api';
import { Component } from '@atlassian/forge-graphql';

import { ImportableProject } from '../types';
import { COMMIT_MESSAGE, COMPASS_YML_BRANCH, MR_DESCRIPTION, MR_TITLE, STORAGE_SECRETS } from '../constants';
import { getTrackingBranchName } from './get-tracking-branch';
import { createCompassYml, generateCompassYamlData } from '../utils/create-compass-yaml';
import { createFileInProject, createMergeRequest } from '../client/gitlab';
import validateConfigFile from './sync-component-with-file/validate-config-file';

const FILE_PATH = 'compass.yml';
const ENCODING = 'base64';

export const createMRWithCompassYML = async (project: ImportableProject, component: Component, groupId: number) => {
  const { id, defaultBranch, url } = project;

  const groupToken = await storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`);
  const trackingBranch = await getTrackingBranchName(groupToken, id, defaultBranch);
  const compassYamlData = generateCompassYamlData(url, component);

  validateConfigFile(compassYamlData, component);

  const content = createCompassYml(compassYamlData);

  await createFileInProject(
    groupToken,
    id,
    FILE_PATH,
    COMPASS_YML_BRANCH,
    trackingBranch,
    ENCODING,
    content,
    COMMIT_MESSAGE,
  );

  await createMergeRequest(groupToken, id, COMPASS_YML_BRANCH, trackingBranch, MR_TITLE, MR_DESCRIPTION, true);
};
