import { GitLabHeaders, GitlabPaginatedFetch } from '../client/gitlab';

export const fetchPaginatedData = async <D, P>(
  fetchFn: GitlabPaginatedFetch<D, P>,
  fetchFnParameters: Record<'baseUrl', string> & Record<'groupToken', string> & P,
  page = 1,
  perPage = 100,
): Promise<D[]> => {
  const { data: firstPageData, headers } = await fetchFn(page, perPage, fetchFnParameters);
  const total = Number(headers.get(GitLabHeaders.PAGINATION_TOTAL));

  if (total <= perPage) {
    return firstPageData;
  }

  const numberOfPages = Math.ceil(total / perPage);
  const promises = [];

  for (let pageNumber = 2; pageNumber <= numberOfPages; pageNumber += 1) {
    promises.push(fetchFn(pageNumber, perPage, fetchFnParameters));
  }

  const restOfData = await Promise.all(promises);

  return [...firstPageData, ...restOfData.map(({ data }) => data).flat()];
};
