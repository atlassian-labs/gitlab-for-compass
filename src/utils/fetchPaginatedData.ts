import { GitLabHeaders, GitlabPaginatedFetch } from '../client/gitlab';
import { getFormattedErrors, hasRejections } from './promise-allsettled-helpers';

export const fetchPaginatedData = async <D, P>(
  fetchFn: GitlabPaginatedFetch<D, P>,
  fetchFnParameters: Record<'groupToken', string> & P,
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

  const restOfDataResults = await Promise.allSettled(promises);

  if (hasRejections(restOfDataResults)) {
    throw new Error(`Error getting data results: ${getFormattedErrors(restOfDataResults)}`);
  }

  const restOfData = restOfDataResults.map(
    (restOfDataResult) => (restOfDataResult as PromiseFulfilledResult<{ data: D[]; headers: Headers }>).value,
  );

  return [...firstPageData, ...restOfData.map(({ data }) => data).flat()];
};
