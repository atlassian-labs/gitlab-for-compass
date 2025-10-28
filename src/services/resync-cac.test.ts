import { Queue } from '@forge/events';
import { resyncConfigAsCode } from './resync-cac';
import { FileData, Queues } from '../types';

jest.mock('@forge/events', () => ({
  Queue: jest.fn(),
}));

describe('resyncConfigAsCode', () => {
  const mockPush = jest.fn();
  const cloudId = 'cloud-123';
  const fileData = [
    {
      projectId: 1,
      groupId: 1,
      ref: 'ref1',
      path: 'file1.yml',
    },
    {
      projectId: 2,
      groupId: 2,
      ref: 'ref2',
      path: 'file2.yml',
    },
  ] as FileData[];

  beforeEach(() => {
    jest.clearAllMocks();
    (Queue as unknown as jest.Mock).mockImplementation(() => ({
      push: mockPush,
    }));
    mockPush.mockResolvedValueOnce('job-1').mockResolvedValueOnce('job-2');
  });

  it('creates a Queue with the correct key', async () => {
    await resyncConfigAsCode(cloudId, fileData);
    expect(Queue).toHaveBeenCalledWith({ key: Queues.RESYNC_CAC });
  });

  it('pushes each fileData item to the queue with correct payload and delay', async () => {
    await resyncConfigAsCode(cloudId, fileData);
    expect(mockPush).toHaveBeenCalledTimes(fileData.length);
    expect(mockPush).toHaveBeenNthCalledWith(1, { cloudId, data: fileData[0] }, { delayInSeconds: 2 });
    expect(mockPush).toHaveBeenNthCalledWith(2, { cloudId, data: fileData[1] }, { delayInSeconds: 2 });
  });

  it('handles empty fileData array', async () => {
    await resyncConfigAsCode(cloudId, []);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
