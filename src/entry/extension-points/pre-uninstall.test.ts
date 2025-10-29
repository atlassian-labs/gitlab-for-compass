/* eslint-disable no-console */
import preUninstall from './pre-uninstall';
import { getFormattedErrors, hasRejections } from '../../utils/promise-allsettled-helpers';
import { disconnectGroup } from '../../services/disconnect-group';
import { getForgeAppId } from '../../utils/get-forge-app-id';
import { getGroupIds } from '../../utils/storage-utils';

jest.mock('../../utils/promise-allsettled-helpers');
jest.mock('../../services/disconnect-group');
jest.mock('../../utils/get-forge-app-id');
jest.mock('../../utils/storage-utils');

describe('preUninstall', () => {
  const cloudId = 'cloud-123';
  const payload = { context: { cloudId } };
  const forgeAppId = 'app-456';
  const groupIds = ['g1', 'g2'];

  let originalConsoleLog: any;
  let originalConsoleError: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (getForgeAppId as jest.Mock).mockReturnValue(forgeAppId);
    (getGroupIds as jest.Mock).mockResolvedValue(groupIds);
    (disconnectGroup as jest.Mock).mockResolvedValue(undefined);
    (hasRejections as jest.Mock).mockReturnValue(false);
    (getFormattedErrors as jest.Mock).mockReturnValue('some error');
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('logs and disconnects all groups successfully', async () => {
    await preUninstall(payload);

    expect(console.log).toHaveBeenCalledWith(`Performing preUninstall for site ${cloudId}`);
    expect(getForgeAppId).toHaveBeenCalled();
    expect(getGroupIds).toHaveBeenCalled();
    expect(disconnectGroup).toHaveBeenCalledTimes(groupIds.length);
    for (const groupId of groupIds) {
      expect(disconnectGroup).toHaveBeenCalledWith(groupId, cloudId, forgeAppId);
    }
    expect(console.error).not.toHaveBeenCalled();
  });

  it('logs error if there are rejections', async () => {
    (hasRejections as jest.Mock).mockReturnValue(true);
    (getFormattedErrors as jest.Mock).mockReturnValue('disconnect failed');
    await preUninstall(payload);

    expect(console.error).toHaveBeenCalledWith({
      message: 'Error performing preUninstall',
      error: expect.any(Error),
    });
    const errorArg = (console.error as jest.Mock).mock.calls[0][0].error;
    expect(errorArg.message).toContain('disconnect failed');
  });

  it('logs error if getGroupIds throws', async () => {
    (getGroupIds as jest.Mock).mockRejectedValue(new Error('storage error'));
    await preUninstall(payload);

    expect(console.error).toHaveBeenCalledWith({
      message: 'Error performing preUninstall',
      error: expect.any(Error),
    });
    const errorArg = (console.error as jest.Mock).mock.calls[0][0].error;
    expect(errorArg.message).toContain('storage error');
  });

  it('logs error if disconnectGroup throws', async () => {
    (disconnectGroup as jest.Mock).mockImplementationOnce(() => {
      throw new Error('disconnect error');
    });
    await preUninstall(payload);

    expect(console.error).toHaveBeenCalledWith({
      message: 'Error performing preUninstall',
      error: expect.any(Error),
    });
    const errorArg = (console.error as jest.Mock).mock.calls[0][0].error;
    expect(errorArg.message).toContain('disconnect error');
  });
});
