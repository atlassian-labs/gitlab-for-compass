import { mapStateToColor, mapStateToText, mapPRCreationStateToColor, mapPRCreationStateToText } from './utils';
import { CREATE_PR_STATE, IMPORT_STATE } from '../../hooks/useImportAll';

jest.mock('@forge/bridge', () => ({
  showFlag: jest.fn(),
}));

describe('mapStateToColor', () => {
  it('returns correct color for SUCCESS', () => {
    expect(mapStateToColor(IMPORT_STATE.SUCCESS)).toBe('color.text.success');
  });
  it('returns correct color for ALREADY_IMPORTED', () => {
    expect(mapStateToColor(IMPORT_STATE.ALREADY_IMPORTED)).toBe('color.text.warning');
  });
  it('returns correct color for FAILED', () => {
    expect(mapStateToColor(IMPORT_STATE.FAILED)).toBe('color.text.danger');
  });
  it('returns default color for undefined', () => {
    expect(mapStateToColor(undefined)).toBe('color.text.success');
  });
  it('returns default color for unknown value', () => {
    expect(mapStateToColor('UNKNOWN' as IMPORT_STATE)).toBe('color.text.success');
  });
});

describe('mapStateToText', () => {
  it('returns correct text for SUCCESS', () => {
    expect(mapStateToText(IMPORT_STATE.SUCCESS)).toBe('Successfully imported');
  });
  it('returns correct text for ALREADY_IMPORTED', () => {
    expect(mapStateToText(IMPORT_STATE.ALREADY_IMPORTED)).toBe('Already imported');
  });
  it('returns correct text for FAILED', () => {
    expect(mapStateToText(IMPORT_STATE.FAILED)).toBe('Import failed');
  });
  it('returns default text for undefined', () => {
    expect(mapStateToText(undefined)).toBe('Successfully imported');
  });
  it('returns default text for unknown value', () => {
    expect(mapStateToText('UNKNOWN' as IMPORT_STATE)).toBe('Successfully imported');
  });
});

describe('mapPRCreationStateToColor', () => {
  it('returns correct color for SUCCESS', () => {
    expect(mapPRCreationStateToColor(CREATE_PR_STATE.SUCCESS)).toBe('color.text.success');
  });
  it('returns correct color for FAILED', () => {
    expect(mapPRCreationStateToColor(CREATE_PR_STATE.FAILED)).toBe('color.text.danger');
  });
  it('returns default color for undefined', () => {
    expect(mapPRCreationStateToColor(undefined)).toBe('color.text.success');
  });
  it('returns default color for unknown value', () => {
    expect(mapPRCreationStateToColor('UNKNOWN' as CREATE_PR_STATE)).toBe('color.text.success');
  });
});

describe('mapPRCreationStateToText', () => {
  it('returns correct text for SUCCESS', () => {
    expect(mapPRCreationStateToText(CREATE_PR_STATE.SUCCESS)).toBe('Pull request successfully created');
  });
  it('returns correct text for FAILED', () => {
    expect(mapPRCreationStateToText(CREATE_PR_STATE.FAILED)).toBe('Pull request creation failed');
  });
  it('returns default text for undefined', () => {
    expect(mapPRCreationStateToText(undefined)).toBe('Pull request successfully created');
  });
  it('returns default text for unknown value', () => {
    expect(mapPRCreationStateToText('UNKNOWN' as CREATE_PR_STATE)).toBe('Pull request successfully created');
  });
});
