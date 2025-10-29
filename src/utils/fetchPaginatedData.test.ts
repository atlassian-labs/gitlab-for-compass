import { fetchPaginatedData } from './fetchPaginatedData';
import { GitLabHeaders, GitlabPaginatedFetch } from '../client/gitlab';
import * as promiseHelpers from './promise-allsettled-helpers';

describe('fetchPaginatedData', () => {
  const groupToken = 'token';
  const params = { groupToken } as const;

  function makeHeaders(total: number) {
    return {
      get: (key: string) => (key === GitLabHeaders.PAGINATION_TOTAL ? String(total) : undefined),
    } as Headers;
  }

  it('returns data for a single page (total <= perPage)', async () => {
    const fetchFn: GitlabPaginatedFetch<number, typeof params> = jest.fn().mockResolvedValue({
      data: [1, 2, 3],
      headers: makeHeaders(3),
    });

    const result = await fetchPaginatedData(fetchFn, params, 1, 100);
    expect(result).toEqual([1, 2, 3]);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith(1, 100, params);
  });

  it('fetches and combines data from multiple pages', async () => {
    // total = 4, perPage = 2 => numberOfPages = 2 (pages 1 and 2)
    const fetchFn: GitlabPaginatedFetch<number, typeof params> = jest.fn().mockImplementation((page) => {
      if (page === 1) {
        return Promise.resolve({
          data: [1, 2],
          headers: makeHeaders(4),
        });
      }
      if (page === 2) {
        return Promise.resolve({
          data: [3],
          headers: makeHeaders(4),
        });
      }
      throw new Error('Unexpected page');
    });

    const result = await fetchPaginatedData(fetchFn, params, 1, 2);
    expect(result).toEqual([1, 2, 3]);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn).toHaveBeenCalledWith(1, 2, params);
    expect(fetchFn).toHaveBeenCalledWith(2, 2, params);
  });

  it('throws if any page rejects', async () => {
    const fetchFn: GitlabPaginatedFetch<number, typeof params> = jest.fn().mockImplementation((page) => {
      if (page === 1) {
        return Promise.resolve({
          data: [1, 2],
          headers: makeHeaders(4),
        });
      }
      if (page === 2) {
        return Promise.resolve({
          data: [3],
          headers: makeHeaders(4),
        });
      }
      throw new Error('Unexpected page');
    });

    // Patch Promise.allSettled to simulate a rejection on page 2
    const originalAllSettled = Promise.allSettled;
    jest.spyOn(Promise, 'allSettled').mockImplementation(() => {
      return originalAllSettled.call(Promise, [
        Promise.resolve({ data: [3], headers: makeHeaders(4) }),
        Promise.reject(new Error('fail')),
      ]);
    });

    jest.spyOn(promiseHelpers, 'hasRejections').mockReturnValue(true);
    jest.spyOn(promiseHelpers, 'getFormattedErrors').mockReturnValue('fail');

    await expect(fetchPaginatedData(fetchFn, params, 1, 2)).rejects.toThrow('Error getting data results: fail');

    (Promise.allSettled as jest.Mock).mockRestore();
    (promiseHelpers.hasRejections as jest.Mock).mockRestore();
    (promiseHelpers.getFormattedErrors as jest.Mock).mockRestore();
  });

  it('returns empty array if no data', async () => {
    const fetchFn: GitlabPaginatedFetch<number, typeof params> = jest.fn().mockResolvedValue({
      data: [],
      headers: makeHeaders(0),
    });

    const result = await fetchPaginatedData(fetchFn, params, 1, 100);
    expect(result).toEqual([]);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
