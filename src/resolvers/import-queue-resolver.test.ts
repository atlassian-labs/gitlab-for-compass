import { storage } from '@forge/api';
import { internalMetrics } from '@forge/metrics';
import { backOff } from 'exponential-backoff';
import { createComponent, createComponentSlug, updateComponent } from '../client/compass';
import { appendLink } from '../utils/append-link';
import { sleep } from '../utils/time-utils';
import { createMRWithCompassYML } from '../services/create-mr-with-compass-yml';
import { formatLabels } from '../utils/labels-utils';
import handler from './import-queue-resolver';

jest.mock('@forge/api', () => ({
  storage: {
    set: jest.fn(),
  },
}));
jest.mock('@forge/metrics', () => ({
  internalMetrics: {
    counter: jest.fn(() => ({
      incr: jest.fn(),
    })),
  },
}));
jest.mock('exponential-backoff', () => ({
  backOff: jest.fn((fn) => fn()),
}));
jest.mock('../client/compass', () => ({
  createComponent: jest.fn(),
  createComponentSlug: jest.fn(),
  updateComponent: jest.fn(),
}));
jest.mock('../utils/append-link', () => ({
  appendLink: jest.fn((url, links) => [...(links || []), { type: 'Repository', url }]),
}));
jest.mock('../utils/time-utils', () => ({
  sleep: jest.fn(() => Promise.resolve()),
}));
jest.mock('../services/create-mr-with-compass-yml', () => ({
  createMRWithCompassYML: jest.fn(),
}));
jest.mock('../utils/labels-utils', () => ({
  formatLabels: jest.fn((labels) => labels || []),
}));

describe('import resolver', () => {
  const cloudId = 'cloud-123';
  const groupId = 42;
  const projectBase = {
    id: 1,
    name: 'repo',
    hasComponent: false,
    isCompassFilePrOpened: false,
    isManaged: false,
    description: 'desc',
    type: 'service',
    labels: ['foo'],
    url: 'https://repo',
    componentLinks: [] as any,
    componentId: 'comp-1',
    shouldOpenMR: false,
    ownerId: 'owner-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (internalMetrics.counter as jest.Mock).mockReturnValue({ incr: jest.fn() });
    (createComponent as jest.Mock).mockResolvedValue({ id: 'comp-1' });
    (createComponentSlug as jest.Mock).mockResolvedValue(undefined);
    (updateComponent as jest.Mock).mockResolvedValue({ id: 'comp-1' });
    (appendLink as jest.Mock).mockImplementation((url, links) => [...(links || []), { type: 'Repository', url }]);
    (sleep as jest.Mock).mockResolvedValue(undefined);
    (createMRWithCompassYML as jest.Mock).mockResolvedValue(undefined);
    (formatLabels as jest.Mock).mockImplementation((labels) => labels || []);
    (storage.set as jest.Mock).mockResolvedValue(undefined);
    (backOff as jest.Mock).mockImplementation((fn) => fn());
  });

  it('creates a new component if hasComponent is false', async () => {
    const payload = {
      createProjectData: JSON.stringify({ cloudId, groupId, project: { ...projectBase, hasComponent: false } }),
    };

    const invokePayload = {
      call: {
        functionKey: 'import',
        payload,
      },
      context: {
        cloudId,
      },
    };
    await handler(invokePayload);

    expect(createComponent).toHaveBeenCalledWith(cloudId, expect.objectContaining({ id: 1 }));
    expect(createComponentSlug).toHaveBeenCalledWith('comp-1', 'repo');
    expect(updateComponent).not.toHaveBeenCalled();
    expect(createMRWithCompassYML).not.toHaveBeenCalled();
    expect(internalMetrics.counter).toHaveBeenCalledWith('compass.gitlab.import.start');
  });

  it('creates a new component and opens MR if shouldOpenMR is true', async () => {
    const payload = {
      createProjectData: JSON.stringify({
        cloudId,
        groupId,
        project: { ...projectBase, hasComponent: false, shouldOpenMR: true },
      }),
    };
    const invokePayload = {
      call: {
        functionKey: 'import',
        payload,
      },
      context: {
        cloudId,
      },
    };
    await handler(invokePayload);

    expect(createComponent).toHaveBeenCalled();
    expect(createMRWithCompassYML).toHaveBeenCalledWith(expect.anything(), 'comp-1', groupId);
  });

  it('updates an existing component if hasComponent is true', async () => {
    const payload = {
      createProjectData: JSON.stringify({
        cloudId,
        groupId,
        project: { ...projectBase, hasComponent: true },
      }),
    };
    const invokePayload = {
      call: {
        functionKey: 'import',
        payload,
      },
      context: {
        cloudId,
      },
    };
    await handler(invokePayload);

    expect(updateComponent).toHaveBeenCalledWith(expect.objectContaining({ id: 'comp-1' }));
    expect(createComponentSlug).toHaveBeenCalledWith('comp-1', 'repo');
    expect(createComponent).not.toHaveBeenCalled();
    expect(internalMetrics.counter).toHaveBeenCalledWith('compass.gitlab.import.start');
  });

  it('updates an existing component and opens MR if shouldOpenMR is true', async () => {
    const payload = {
      createProjectData: JSON.stringify({
        cloudId,
        groupId,
        project: { ...projectBase, hasComponent: true, shouldOpenMR: true },
      }),
    };
    const invokePayload = {
      call: {
        functionKey: 'import',
        payload,
      },
      context: {
        cloudId,
      },
    };
    await handler(invokePayload);

    expect(updateComponent).toHaveBeenCalled();
    expect(createMRWithCompassYML).toHaveBeenCalledWith(expect.anything(), 'comp-1', groupId);
  });

  it('stores failed project and increments fail metric if updateComponent returns err', async () => {
    (updateComponent as jest.Mock).mockResolvedValue({ id: 'comp-1', err: 'fail' });
    const payload = {
      createProjectData: JSON.stringify({
        cloudId,
        groupId,
        project: { ...projectBase, hasComponent: true },
      }),
    };
    const invokePayload = {
      call: {
        functionKey: 'import',
        payload,
      },
      context: {
        cloudId,
      },
    };
    await handler(invokePayload);

    expect(internalMetrics.counter).toHaveBeenCalledWith('compass.gitlab.import.end.fail');
    expect(storage.set).toHaveBeenCalledWith(
      expect.stringContaining(`${projectBase.id}`),
      expect.objectContaining({ id: 1 }),
    );
  });

  it('handles errors in createComponent and stores failed project', async () => {
    (createComponent as jest.Mock).mockRejectedValue(new Error('fail'));
    const payload = {
      createProjectData: JSON.stringify({
        cloudId,
        groupId,
        project: { ...projectBase, hasComponent: false },
      }),
    };
    const invokePayload = {
      call: {
        functionKey: 'import',
        payload,
      },
      context: {
        cloudId,
      },
    };
    await handler(invokePayload);

    expect(internalMetrics.counter).toHaveBeenCalledWith('compass.gitlab.import.end.fail');
    expect(storage.set).toHaveBeenCalledWith(
      expect.stringContaining(`${projectBase.id}`),
      expect.objectContaining({ id: 1 }),
    );
  });

  it('handles errors in updateComponent and stores failed project', async () => {
    (updateComponent as jest.Mock).mockRejectedValue(new Error('fail'));
    const payload = {
      createProjectData: JSON.stringify({
        cloudId,
        groupId,
        project: { ...projectBase, hasComponent: true },
      }),
    };
    const invokePayload = {
      call: {
        functionKey: 'import',
        payload,
      },
      context: {
        cloudId,
      },
    };
    await handler(invokePayload);

    expect(internalMetrics.counter).toHaveBeenCalledWith('compass.gitlab.import.end.fail');
    expect(storage.set).toHaveBeenCalledWith(
      expect.stringContaining(`${projectBase.id}`),
      expect.objectContaining({ id: 1 }),
    );
  });
});
