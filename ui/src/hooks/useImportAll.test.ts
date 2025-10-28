import { renderHook, act } from '@testing-library/react-hooks';
import { showFlag } from '@forge/bridge';
import { useImportAll, IMPORT_STATE, CREATE_PR_STATE } from './useImportAll';
import { useAppContext } from './useAppContext';
import { useComponentTypes } from './useComponentTypes';
import { useImportAllCaCContext } from './useImportAllCaCContext';
import * as invokes from '../services/invokes';
import * as utils from '../components/utils';

jest.mock('@forge/bridge', () => ({
  showFlag: jest.fn(),
}));
jest.mock('./useAppContext');
jest.mock('./useComponentTypes');
jest.mock('./useImportAllCaCContext');
jest.mock('../services/invokes');
jest.mock('../components/utils');

const mockComponentTypes = [
  { id: 'service', name: 'Service' },
  { id: 'library', name: 'Library' },
];

const mockProjects = [
  { id: 1, typeId: 'service', hasComponent: false, isCompassFilePrOpened: false, isManaged: false },
  { id: 2, typeId: 'library', hasComponent: true, isCompassFilePrOpened: false, isManaged: false },
  { id: 3, typeId: 'library', hasComponent: false, isCompassFilePrOpened: false, isManaged: true },
];

function flushPromises() {
  return act(() => Promise.resolve());
}

describe('useImportAll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAppContext as jest.Mock).mockReturnValue({
      getConnectedInfo: jest.fn().mockResolvedValue([{ id: 123 }]),
    });
    (useComponentTypes as jest.Mock).mockReturnValue({ componentTypes: mockComponentTypes });
    (useImportAllCaCContext as jest.Mock).mockReturnValue({ isCaCEnabledForImportAll: false });
    (utils.getComponentTypeOptionForBuiltInType as jest.Mock).mockReturnValue({ label: 'Default', value: 'default' });
    (utils.sleep as jest.Mock).mockResolvedValue(undefined);

    // Default: break the while loop after one iteration
    (invokes.getGroupProjects as jest.Mock)
      .mockResolvedValueOnce({
        data: { projects: mockProjects, total: mockProjects.length },
        errors: [],
      })
      .mockResolvedValueOnce({
        data: { projects: [], total: mockProjects.length },
        errors: [],
      });
    (invokes.getGroupProjects as jest.Mock).mockResolvedValue({
      data: { projects: [], total: mockProjects.length },
      errors: [],
    });

    (invokes.createSingleComponent as jest.Mock).mockResolvedValue({ success: true, data: { id: 'comp1' } });
    (invokes.createMRWithCompassYML as jest.Mock).mockResolvedValue({ success: true });
  });

  it('imports projects successfully and sets correct states', async () => {
    const { result } = renderHook(() => useImportAll());
    await flushPromises();
    await flushPromises();

    expect(result.current.importedProjects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, state: IMPORT_STATE.SUCCESS }),
        expect.objectContaining({ id: 2, state: IMPORT_STATE.ALREADY_IMPORTED }),
        expect.objectContaining({ id: 3, state: IMPORT_STATE.ALREADY_IMPORTED }),
      ]),
    );
    expect(result.current.isImporting).toBe(false);
  });

  it('sets error and calls showFlag if getConnectedInfo fails', async () => {
    (useAppContext as jest.Mock).mockReturnValue({
      getConnectedInfo: jest.fn().mockRejectedValue(new Error('fail')),
    });

    renderHook(() => useImportAll());
    await flushPromises();
    await flushPromises();

    expect(showFlag).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'import-all-error-connected-info-flag',
        type: 'error',
      }),
    );
  });

  it('handles createSingleComponent failure', async () => {
    (invokes.createSingleComponent as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useImportAll());
    await flushPromises();
    await flushPromises();

    // The first project should be marked as FAILED
    expect(result.current.importedProjects).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 1, state: IMPORT_STATE.FAILED })]),
    );
  });

  it('handles createMRWithCompassYML success and failure when CaC is enabled', async () => {
    (useImportAllCaCContext as jest.Mock).mockReturnValue({ isCaCEnabledForImportAll: true });
    (invokes.createSingleComponent as jest.Mock).mockResolvedValue({ success: true, data: { id: 'comp1' } });
    (invokes.createMRWithCompassYML as jest.Mock)
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false });

    // Only one project, not already imported/managed
    (invokes.getGroupProjects as jest.Mock)
      .mockResolvedValueOnce({
        data: { projects: [mockProjects[0], mockProjects[1]], total: 2 },
        errors: [],
      })
      .mockResolvedValueOnce({
        data: { projects: [], total: 2 },
        errors: [],
      });
    (invokes.getGroupProjects as jest.Mock).mockResolvedValue({
      data: { projects: [], total: 2 },
      errors: [],
    });

    const { result } = renderHook(() => useImportAll());
    await flushPromises();
    await flushPromises();

    // First project: PR success, second project: already imported
    expect(result.current.importedProjects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, state: IMPORT_STATE.SUCCESS, createPRState: CREATE_PR_STATE.SUCCESS }),
        expect.objectContaining({ id: 2, state: IMPORT_STATE.ALREADY_IMPORTED }),
      ]),
    );
  });

  it('handles createMRWithCompassYML throwing error', async () => {
    (useImportAllCaCContext as jest.Mock).mockReturnValue({ isCaCEnabledForImportAll: true });
    (invokes.createSingleComponent as jest.Mock).mockResolvedValue({ success: true, data: { id: 'comp1' } });
    (invokes.createMRWithCompassYML as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    (invokes.getGroupProjects as jest.Mock)
      .mockResolvedValueOnce({
        data: { projects: [mockProjects[0]], total: 1 },
        errors: [],
      })
      .mockResolvedValueOnce({
        data: { projects: [], total: 1 },
        errors: [],
      });
    (invokes.getGroupProjects as jest.Mock).mockResolvedValue({
      data: { projects: [], total: 1 },
      errors: [],
    });

    const { result } = renderHook(() => useImportAll());
    await flushPromises();
    await flushPromises();

    expect(result.current.importedProjects[0]).toEqual(
      expect.objectContaining({ id: 1, state: IMPORT_STATE.SUCCESS, createPRState: CREATE_PR_STATE.FAILED }),
    );
  });

  it('retryFailedProjects only retries failed projects', async () => {
    (invokes.createSingleComponent as jest.Mock).mockResolvedValue({ success: true, data: { id: 'comp1' } });

    const { result } = renderHook(() => useImportAll());
    await flushPromises();
    await flushPromises();

    // Simulate failed and successful projects
    const projectsToRetry = [
      { id: 1, state: IMPORT_STATE.FAILED },
      { id: 2, state: IMPORT_STATE.SUCCESS },
    ];

    await act(async () => {
      await result.current.retryFailedProjects(projectsToRetry as any);
    });

    // Only the failed project should be retried (importedProjects should have one entry)
    expect(result.current.importedProjects.length).toBe(1);
    expect(result.current.importedProjects[0].id).toBe(1);
  });

  it('handles duplicate projects and only imports unique ones', async () => {
    const duplicateProjects = [
      { id: 1, typeId: 'service', hasComponent: false, isCompassFilePrOpened: false, isManaged: false },
      { id: 1, typeId: 'service', hasComponent: false, isCompassFilePrOpened: false, isManaged: false },
    ];
    (invokes.getGroupProjects as jest.Mock)
      .mockResolvedValueOnce({
        data: { projects: duplicateProjects, total: 2 },
        errors: [],
      })
      .mockResolvedValueOnce({
        data: { projects: [], total: 2 },
        errors: [],
      });
    (invokes.getGroupProjects as jest.Mock).mockResolvedValue({
      data: { projects: [], total: 2 },
      errors: [],
    });

    const { result } = renderHook(() => useImportAll());
    await flushPromises();
    await flushPromises();

    // Only one import for the unique project
    expect(result.current.importedProjects.filter((p) => p.id === 1).length).toBe(1);
  });
});
