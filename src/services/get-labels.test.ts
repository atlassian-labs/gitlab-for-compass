/* eslint-disable import/first */
import { mocked } from 'jest-mock';
import { mockForgeApi } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { getProjectLanguages } from '../client/gitlab';
import { getProjectLabels } from './get-labels';
import { BASE_URL, TEST_TOKEN } from '../__tests__/fixtures/gitlab-data';

jest.mock('../client/gitlab');
const mockGetProjectLanguages = mocked(getProjectLanguages);
const MOCK_TOPICS = ['topic-1', 'topic-2'];
const MOCK_PROJECT_ID = 12345;

describe('get project labels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns correct labels in case getProjectLanguages fails', async () => {
    mockGetProjectLanguages.mockRejectedValue(new Error('Ooops!'));

    const result = await getProjectLabels(MOCK_PROJECT_ID, BASE_URL, TEST_TOKEN, MOCK_TOPICS);

    expect(result).toEqual(MOCK_TOPICS);
  });

  it('returns correct labels and calculate main language', async () => {
    mockGetProjectLanguages.mockResolvedValue({
      bash: 8.2,
      javascript: 89.8,
      html: 2,
    });

    const result = await getProjectLabels(MOCK_PROJECT_ID, BASE_URL, TEST_TOKEN, MOCK_TOPICS);

    expect(result).toEqual([...MOCK_TOPICS, 'language:javascript']);
  });
});
