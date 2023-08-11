/* eslint-disable import/first */
// import { mockForgeApi } from '../__tests__/helpers/forge-helper';
import { truncateProjectNameString, DESCRIPTION_TRUNCATION_LENGTH } from './event-mapping';

// mockForgeApi();

const TOO_LONG_PROJECT_NAME = `a`.repeat(300);
const SHORT_PROJECT_NAME = `a`.repeat(150);
const VERY_SHORT_PROJECT_NAME = `a`.repeat(50);
const JUST_RIGHT_PROJECT_NAME = `a`.repeat(230);

const BEFORE_STRING = `beforeString `;
const AFTER_STRING = ` afterString`;

describe('stringTruncatedOnlyWhenNecessary', () => {
  it('total description length is <255 and >100 characters, should not be truncated', () => {
    const currentLength = BEFORE_STRING.length + SHORT_PROJECT_NAME.length + AFTER_STRING.length;
    const result = truncateProjectNameString(`beforeString `, SHORT_PROJECT_NAME, ` afterString`); // before + after = 25 chars

    expect(currentLength).toEqual(result.length);
  });

  it('total description length is <100 characters, should not be truncated', () => {
    const currentLength = BEFORE_STRING.length + VERY_SHORT_PROJECT_NAME.length + AFTER_STRING.length;
    const result = truncateProjectNameString(`beforeString `, VERY_SHORT_PROJECT_NAME, ` afterString`);

    expect(currentLength).toEqual(result.length);
  });

  it('total description length is =255 characters, should not be truncated', () => {
    const currentLength = BEFORE_STRING.length + JUST_RIGHT_PROJECT_NAME.length + AFTER_STRING.length;
    const result = truncateProjectNameString(`beforeString `, JUST_RIGHT_PROJECT_NAME, ` afterString`);

    expect(currentLength).toEqual(result.length);
  });

  it('total description length is >255 characters, should be truncated to 255 characters', () => {
    const currentLength = BEFORE_STRING.length + TOO_LONG_PROJECT_NAME.length + AFTER_STRING.length;
    const result = truncateProjectNameString(`beforeString `, TOO_LONG_PROJECT_NAME, ` afterString`);

    expect(result.length).toEqual(DESCRIPTION_TRUNCATION_LENGTH);
  });
});
