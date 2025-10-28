import { checkCaCFilename } from './cac-filename-check';

describe('checkCaCFilename', () => {
  it('returns true if path contains compass.yml', () => {
    expect(checkCaCFilename('compass.yml')).toBe(true);
    expect(checkCaCFilename('foo/compass.yml')).toBe(true);
    expect(checkCaCFilename('foo/bar/compass.yml')).toBe(true);
  });

  it('returns true if path contains compass.yaml', () => {
    expect(checkCaCFilename('compass.yaml')).toBe(true);
    expect(checkCaCFilename('foo/compass.yaml')).toBe(true);
    expect(checkCaCFilename('foo/bar/compass.yaml')).toBe(true);
  });

  it('returns false if path does not contain compass.yml or compass.yaml', () => {
    expect(checkCaCFilename('foo/bar/baz.yml')).toBe(false);
    expect(checkCaCFilename('foo/compassyml')).toBe(false);
    expect(checkCaCFilename('foo/compass.yaml.txt')).toBe(false);
    expect(checkCaCFilename('foo/bar/compass.yam')).toBe(false);
    expect(checkCaCFilename('foo/bar/compass.yml.bak')).toBe(false);
    expect(checkCaCFilename('')).toBe(false);
  });

  it('is case sensitive', () => {
    expect(checkCaCFilename('foo/Compass.yml')).toBe(false);
    expect(checkCaCFilename('foo/COMPASS.YAML')).toBe(false);
  });
});
