import { renderHook, act } from '@testing-library/react-hooks';
import { useImportProgress } from './useImportProgress';
import * as invokes from '../services/invokes';
import * as useImportContextModule from './useImportContext';
import * as useIntervalModule from './useInterval';
import { ImportErrorTypes } from '../resolverTypes';

jest.mock('../services/invokes');
jest.mock('./useImportContext');
jest.mock('./useInterval');

jest.mock('@forge/bridge', () => ({
  invoke: jest.fn(),
  showFlag: jest.fn(),
}));

describe('useImportProgress', () => {
  let setIsImportInProgress: jest.Mock;
  let setImportedRepositories: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setIsImportInProgress = jest.fn();
    setImportedRepositories = jest.fn();

    (useImportContextModule.useImportContext as jest.Mock).mockReturnValue({
      setIsImportInProgress,
      importedRepositories: 0,
      setImportedRepositories,
      totalSelectedRepos: 2,
    });
  });

  it('returns initial state', () => {
    (useIntervalModule.useInterval as jest.Mock).mockImplementation(() => {});
    const { result } = renderHook(() => useImportProgress());
    expect(result.current).toEqual({
      error: undefined,
      importedRepositories: 0,
      totalSelectedRepos: 2,
    });
  });

  it('polls and updates importedRepositories on success', async () => {
    let intervalCallback: () => void = () => {};
    (useIntervalModule.useInterval as jest.Mock).mockImplementation((cb) => {
      intervalCallback = cb;
    });

    (invokes.getImportStatus as jest.Mock).mockResolvedValue({
      success: true,
      data: { success: 1, failed: 1 },
      errors: [],
    });

    (useImportContextModule.useImportContext as jest.Mock).mockReturnValue({
      setIsImportInProgress,
      importedRepositories: 0,
      setImportedRepositories,
      totalSelectedRepos: 2,
    });

    renderHook(() => useImportProgress());

    await act(async () => {
      await intervalCallback();
    });

    expect(invokes.getImportStatus).toHaveBeenCalled();
    expect(setImportedRepositories).toHaveBeenCalledWith(2);
  });

  it('sets error if getImportStatus returns errors', async () => {
    let intervalCallback: () => void = () => {};
    (useIntervalModule.useInterval as jest.Mock).mockImplementation((cb) => {
      intervalCallback = cb;
    });

    (invokes.getImportStatus as jest.Mock).mockResolvedValue({
      success: false,
      data: null,
      errors: [{ errorType: ImportErrorTypes.UNEXPECTED_ERROR }],
    });

    renderHook(() => useImportProgress());

    await act(async () => {
      await intervalCallback();
    });

    expect(invokes.getImportStatus).toHaveBeenCalled();
  });

  it('sets error and stops progress if getImportStatus throws', async () => {
    let intervalCallback: () => void = () => {};
    (useIntervalModule.useInterval as jest.Mock).mockImplementation((cb) => {
      intervalCallback = cb;
    });

    (invokes.getImportStatus as jest.Mock).mockRejectedValue(new Error('fail'));

    renderHook(() => useImportProgress());

    await act(async () => {
      await intervalCallback();
    });

    expect(setIsImportInProgress).toHaveBeenCalledWith(false);
  });

  it('clears progress and stops polling when import is complete', async () => {
    let intervalCallback: () => void = () => {};
    (useIntervalModule.useInterval as jest.Mock).mockImplementation((cb) => {
      intervalCallback = cb;
    });

    (useImportContextModule.useImportContext as jest.Mock).mockReturnValue({
      setIsImportInProgress,
      importedRepositories: 2,
      setImportedRepositories,
      totalSelectedRepos: 2,
    });

    renderHook(() => useImportProgress());

    await act(async () => {
      await intervalCallback();
    });

    expect(setIsImportInProgress).toHaveBeenCalledWith(false);
    expect(setImportedRepositories).toHaveBeenCalledWith(0);
  });
});
