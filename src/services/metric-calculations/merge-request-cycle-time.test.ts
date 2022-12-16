/* eslint-disable import/first */
import { mockForgeApi } from '../../__tests__/helpers/forge-helper';

mockForgeApi();

import { mergeRequests } from '../../__tests__/fixtures/gitlab-data';
import { mergeRequestCycleTime } from './merge-request-cycle-time';

describe('mergeRequestCycleTime', () => {
  it('calculate cycle time', () => {
    expect(mergeRequestCycleTime(mergeRequests)).toBe(13);
  });

  it('calculate cycle time for empty array with MRs', () => {
    expect(mergeRequestCycleTime([])).toBe(0);
  });
});
