import { renderHook, act } from '@testing-library/react-hooks';
import { useTeamsForImport } from './useTeamsForImport';
import { getFirstPageOfTeamsWithMembershipStatus } from '../services/invokes';
import { DefaultErrorTypes } from '../resolverTypes';

jest.mock('@forge/bridge', () => ({
  invoke: jest.fn(),
}));

jest.mock('../services/invokes');

const mockTeams = [
  { id: 'team-1', name: 'Team One', membershipStatus: 'member' },
  { id: 'team-2', name: 'Team Two', membershipStatus: 'non-member' },
];

function flushPromises() {
  return act(() => Promise.resolve());
}

describe('useTeamsForImport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be loading initially', async () => {
    (getFirstPageOfTeamsWithMembershipStatus as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useTeamsForImport());
    expect(result.current.isTeamsDataLoading).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.teams).toBeUndefined();
  });

  it('should set teams on successful fetch', async () => {
    (getFirstPageOfTeamsWithMembershipStatus as jest.Mock).mockResolvedValue({
      success: true,
      data: { teams: mockTeams },
      errors: [],
    });

    const { result } = renderHook(() => useTeamsForImport());
    await flushPromises();
    expect(result.current.isTeamsDataLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.teams).toEqual(mockTeams);
  });

  it('should set error from API errorType', async () => {
    (getFirstPageOfTeamsWithMembershipStatus as jest.Mock).mockResolvedValue({
      success: false,
      data: null,
      errors: [{ errorType: 'SOME_API_ERROR' }],
    });

    const { result } = renderHook(() => useTeamsForImport());
    await flushPromises();
    expect(result.current.isTeamsDataLoading).toBe(false);
    expect(result.current.error).toBe('SOME_API_ERROR');
    expect(result.current.teams).toBeUndefined();
  });

  it('should set default error if API errorType is missing', async () => {
    (getFirstPageOfTeamsWithMembershipStatus as jest.Mock).mockResolvedValue({
      success: false,
      data: null,
      errors: [{}],
    });

    const { result } = renderHook(() => useTeamsForImport());
    await flushPromises();
    expect(result.current.isTeamsDataLoading).toBe(false);
    expect(result.current.error).toBe(DefaultErrorTypes.UNEXPECTED_ERROR);
    expect(result.current.teams).toBeUndefined();
  });

  it('should set error if promise is rejected', async () => {
    (getFirstPageOfTeamsWithMembershipStatus as jest.Mock).mockRejectedValue('Network error');
    const { result } = renderHook(() => useTeamsForImport());
    await flushPromises();
    expect(result.current.isTeamsDataLoading).toBe(false);
    expect(result.current.error).toBe('Network error');
    expect(result.current.teams).toBeUndefined();
  });
});
