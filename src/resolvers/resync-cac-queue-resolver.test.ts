import yaml from 'js-yaml';
import { storage } from '@forge/api';
import { CompassLinkType, ConfigFileActions } from '@atlassian/forge-graphql-types';
import { getFileContent, getProjectById } from '../client/gitlab';
import { syncComponentWithFile } from '../client/compass';
import handler from './resync-cac-queue-resolver'; // Replace with your actual file name

jest.mock('@forge/api', () => ({
  storage: {
    getSecret: jest.fn(),
  },
}));
jest.mock('js-yaml', () => ({
  dump: jest.fn((input) => `yaml: ${JSON.stringify(input)}`),
}));
jest.mock('../client/gitlab', () => ({
  getFileContent: jest.fn(),
  getProjectById: jest.fn(),
}));
jest.mock('../client/compass', () => ({
  syncComponentWithFile: jest.fn(),
}));
jest.mock('../constants', () => ({
  EXTERNAL_SOURCE: 'gitlab',
  STORAGE_SECRETS: {
    GROUP_TOKEN_KEY_PREFIX: 'prefix-',
  },
}));

const payload = {
  cloudId: 'cloud-1',
  data: {
    path: 'some/path/compass.yaml',
    projectId: 123,
    groupId: 456,
    ref: 'main',
  },
};

const mockProject = {
  name: 'Test Project',
  web_url: 'https://gitlab.com/test/project',
};

const mockComponentYaml = { foo: 'bar' };

describe('resyncConfigAsCode resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getSecret as jest.Mock).mockResolvedValue('token-abc');
    (getProjectById as jest.Mock).mockResolvedValue(mockProject);
    (getFileContent as jest.Mock).mockResolvedValue(mockComponentYaml);
    (syncComponentWithFile as jest.Mock).mockResolvedValue(undefined);
    (yaml.dump as jest.Mock).mockImplementation((input) => `yaml: ${JSON.stringify(input)}`);
  });

  it('syncs component with file successfully', async () => {
    await expect(
      handler({
        call: {
          functionKey: 'resyncConfigAsCode',
          payload,
        },
        context: { cloudId: 'cloud-1' },
      }),
    ).resolves.toBeUndefined();

    expect(storage.getSecret).toHaveBeenCalledWith('prefix-456');
    expect(getProjectById).toHaveBeenCalledWith('token-abc', 123);
    expect(getFileContent).toHaveBeenCalledWith('token-abc', 123, 'some/path/compass.yaml', 'main');
    expect(yaml.dump).toHaveBeenCalledWith(mockComponentYaml);

    expect(syncComponentWithFile).toHaveBeenCalledWith(
      expect.objectContaining({
        configFile: 'yaml: {"foo":"bar"}',
        externalSourceURL: mockProject.web_url,
        configFileMetadata: expect.objectContaining({
          configFileAction: ConfigFileActions.UPDATE,
          newPath: 'some/path/compass.yaml',
          oldPath: 'some/path/compass.yaml',
          deduplicationId: '123',
        }),
        cloudId: 'cloud-1',
        additionalExternalAliases: [
          {
            externalId: '123',
            externalSource: 'gitlab',
          },
        ],
        additionalLinks: [{ url: mockProject.web_url, type: CompassLinkType.Repository }],
      }),
    );
  });
});
