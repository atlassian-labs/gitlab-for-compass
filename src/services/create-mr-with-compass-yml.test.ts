import { storage } from '@forge/api';
import { createMRWithCompassYML } from './create-mr-with-compass-yml';
import { getComponent } from '../client/compass';
import { getTrackingBranchName } from './get-tracking-branch';
import { createCompassYml, generateCompassYamlData } from '../utils/create-compass-yaml';
import { createFileInProject, createMergeRequest } from '../client/gitlab';
import { ImportableProject } from '../types';
import { COMMIT_MESSAGE, COMPASS_YML_BRANCH, STORAGE_SECRETS, MR_DESCRIPTION, MR_TITLE } from '../constants';

jest.mock('@forge/api', () => ({
  storage: {
    getSecret: jest.fn(),
  },
}));
jest.mock('../client/compass', () => ({
  getComponent: jest.fn(),
}));
jest.mock('./get-tracking-branch', () => ({
  getTrackingBranchName: jest.fn(),
}));
jest.mock('../utils/create-compass-yaml', () => ({
  createCompassYml: jest.fn(),
  generateCompassYamlData: jest.fn(),
}));
jest.mock('../client/gitlab', () => ({
  createFileInProject: jest.fn(),
  createMergeRequest: jest.fn(),
}));

const mockProject = {
  id: 42,
  defaultBranch: 'main',
  foo: 'bar',
  isManaged: false,
  description: '',
  name: '',
  url: '',
  labels: [],
  groupName: '',
  groupPath: '',
  groupFullPath: '',
  typeId: 'Service',
  isCompassFilePrOpened: false,
  hasComponent: false,
} as ImportableProject;

const mockComponent = { id: 'component-1', name: 'Component 1' };
const mockCompassYamlData = { some: 'yaml-data' };
const mockYamlContent = 'yaml-content';
const mockGroupToken = 'group-token';
const mockTrackingBranch = 'main';

describe('createMRWithCompassYML', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getComponent as jest.Mock).mockResolvedValue({ component: mockComponent });
    (storage.getSecret as jest.Mock).mockResolvedValue(mockGroupToken);
    (getTrackingBranchName as jest.Mock).mockResolvedValue(mockTrackingBranch);
    (generateCompassYamlData as jest.Mock).mockReturnValue(mockCompassYamlData);
    (createCompassYml as jest.Mock).mockReturnValue(mockYamlContent);
    (createFileInProject as jest.Mock).mockResolvedValue(undefined);
    (createMergeRequest as jest.Mock).mockResolvedValue(undefined);
  });

  it('calls all dependencies with correct arguments and creates MR', async () => {
    await createMRWithCompassYML(mockProject, 'component-1', 123);

    expect(getComponent).toHaveBeenCalledWith({
      componentId: 'component-1',
      options: { includeCustomFields: true, includeLinks: true },
    });
    expect(storage.getSecret).toHaveBeenCalledWith(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}123`);
    expect(getTrackingBranchName).toHaveBeenCalledWith(mockGroupToken, 42, 'main');
    expect(generateCompassYamlData).toHaveBeenCalledWith(mockComponent, mockProject);
    expect(createCompassYml).toHaveBeenCalledWith(mockCompassYamlData);
    expect(createFileInProject).toHaveBeenCalledWith(
      mockGroupToken,
      42,
      'compass.yml',
      COMPASS_YML_BRANCH,
      mockTrackingBranch,
      'base64',
      mockYamlContent,
      COMMIT_MESSAGE,
    );
    expect(createMergeRequest).toHaveBeenCalledWith(
      mockGroupToken,
      42,
      COMPASS_YML_BRANCH,
      mockTrackingBranch,
      MR_TITLE,
      MR_DESCRIPTION,
      true,
    );
  });

  it('throws if getComponent fails', async () => {
    (getComponent as jest.Mock).mockRejectedValue(new Error('component error'));
    await expect(createMRWithCompassYML(mockProject, 'component-1', 123)).rejects.toThrow('component error');
  });

  it('throws if getSecret fails', async () => {
    (storage.getSecret as jest.Mock).mockRejectedValue(new Error('secret error'));
    await expect(createMRWithCompassYML(mockProject, 'component-1', 123)).rejects.toThrow('secret error');
  });

  it('throws if getTrackingBranchName fails', async () => {
    (getTrackingBranchName as jest.Mock).mockRejectedValue(new Error('branch error'));
    await expect(createMRWithCompassYML(mockProject, 'component-1', 123)).rejects.toThrow('branch error');
  });

  it('throws if createFileInProject fails', async () => {
    (createFileInProject as jest.Mock).mockRejectedValue(new Error('file error'));
    await expect(createMRWithCompassYML(mockProject, 'component-1', 123)).rejects.toThrow('file error');
  });

  it('throws if createMergeRequest fails', async () => {
    (createMergeRequest as jest.Mock).mockRejectedValue(new Error('mr error'));
    await expect(createMRWithCompassYML(mockProject, 'component-1', 123)).rejects.toThrow('mr error');
  });
});
