import { CompassLinkType } from '@atlassian/forge-graphql-types';
import { appendLink } from './append-link';
import { MAX_LINKS_OF_TYPE } from '../constants';
import { YamlLink } from '../types';

describe('appendLink', () => {
  const repoType = CompassLinkType.Repository;

  it('adds a new link if not present', () => {
    const configLinks: YamlLink[] = [{ type: repoType, url: 'https://github.com/other' }];
    const result = appendLink('https://github.com/new', configLinks);
    expect(result).toEqual([
      { type: repoType, url: 'https://github.com/other' },
      { type: repoType, url: 'https://github.com/new' },
    ]);
  });

  it('does not add a duplicate link', () => {
    const configLinks: YamlLink[] = [{ type: repoType, url: 'https://github.com/existing' }];
    const result = appendLink('github.com/existing', configLinks);
    expect(result).toEqual(configLinks);
  });

  it('does not add if max links of type is reached', () => {
    const configLinks: YamlLink[] = [
      { type: repoType, url: 'https://github.com/one' },
      { type: repoType, url: 'https://github.com/two' },
      { type: repoType, url: 'https://github.com/three' },
      { type: repoType, url: 'https://github.com/four' },
      { type: repoType, url: 'https://github.com/five' },
    ];
    const result = appendLink('https://github.com/six', configLinks);
    expect(result).toBe(configLinks); // Should return the same array
    expect(result.length).toBe(MAX_LINKS_OF_TYPE);
  });

  it('adds link if configLinks is empty', () => {
    const result = appendLink('https://github.com/only');
    expect(result).toEqual([{ type: repoType, url: 'https://github.com/only' }]);
  });

  it('does not add if a link with requiredLink as substring exists', () => {
    const configLinks: YamlLink[] = [{ type: repoType, url: 'https://github.com/foo/bar' }];
    // requiredLink is 'github.com/foo', which is a substring of the existing link
    const result = appendLink('github.com/foo', configLinks);
    expect(result).toEqual(configLinks);
  });

  it('adds link if requiredLink is not a substring of any existing link', () => {
    const configLinks: YamlLink[] = [{ type: repoType, url: 'https://github.com/foo/bar' }];
    const result = appendLink('github.com/baz', configLinks);
    expect(result).toEqual([
      { type: repoType, url: 'https://github.com/foo/bar' },
      { type: repoType, url: 'github.com/baz' },
    ]);
  });

  it('ignores links of other types when counting max', () => {
    const configLinks: YamlLink[] = [
      { type: repoType, url: 'https://github.com/one' },
      { type: repoType, url: 'https://github.com/two' },
      { type: repoType, url: 'https://github.com/three' },
      { type: 'OTHER_TYPE' as any, url: 'https://other.com' },
      { type: repoType, url: 'https://github.com/four' },
    ];
    // Only 4 repo links, so should allow one more
    const result = appendLink('https://github.com/five', configLinks);
    expect(result).toEqual([
      { type: repoType, url: 'https://github.com/one' },
      { type: repoType, url: 'https://github.com/two' },
      { type: repoType, url: 'https://github.com/three' },
      { type: 'OTHER_TYPE', url: 'https://other.com' },
      { type: repoType, url: 'https://github.com/four' },
      { type: repoType, url: 'https://github.com/five' },
    ]);
  });
});
