import Resolver from '@forge/resolver';
import { storage } from '@forge/api';
import yaml from 'js-yaml';
import { CompassLinkType, ConfigFileActions } from '@atlassian/forge-graphql-types';
import { FileData } from '../types';
import { EXTERNAL_SOURCE, STORAGE_SECRETS } from '../constants';
import { getFileContent, getProjectById } from '../client/gitlab';
import { syncComponentWithFile } from '../client/compass';

const resolver = new Resolver();

type ReqPayload = {
  cloudId: string;
  data: FileData;
};

const compassYMLRegExp = /compass\.ya?ml/g;

const getFileNameFromPath = (path: string) => compassYMLRegExp.exec(path)[0];

resolver.define('resyncConfigAsCode', async ({ payload }) => {
  const { cloudId, data } = payload as ReqPayload;
  const { path, projectId, groupId, ref } = data;

  const groupToken = await storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`);

  const project = await getProjectById(groupToken, projectId);
  const fileName = getFileNameFromPath(path);

  const fileContents = await getFileContent(groupToken, projectId, path, ref)
    .then((componentYaml) => ({
      componentYaml,
      fileName,
      filePath: `/${path}`,
    }))
    .catch((err) => {
      console.error(`Error during getConfigFileContent when syncing CaC`, err);
      throw err;
    });

  const commonSyncParams = {
    cloudId,
    additionalExternalAliases: [
      {
        externalId: projectId.toString(),
        externalSource: EXTERNAL_SOURCE,
      },
    ],
    additionalLinks: [{ url: project.web_url, type: CompassLinkType.Repository }],
  };

  try {
    await syncComponentWithFile({
      configFile: yaml.dump(fileContents.componentYaml),
      externalSourceURL: project.web_url,
      configFileMetadata: {
        configFileAction: ConfigFileActions.UPDATE,
        newPath: path,
        oldPath: path,
        deduplicationId: projectId.toString(),
      },
      ...commonSyncParams,
    });
  } catch (err) {
    console.error(`Error when syncing components with yaml file for project: ${project.name}`, err);
    throw err;
  }
});

export default resolver.getDefinitions();
