import escapeStringRegexp from 'escape-string-regexp';
import { filterProjects } from './utils';
import { ProjectImportSelection } from '../../services/types';

jest.mock('escape-string-regexp', () => jest.fn((str) => str));

describe('filterProjects', () => {
  const projects: ProjectImportSelection[] = [
    { name: 'Alpha', groupPath: 'group1' },
    { name: 'Beta', groupPath: 'group2' },
    { name: 'Gamma', groupPath: 'group1' },
    { name: 'alphabet', groupPath: 'group1' },
  ] as ProjectImportSelection[];

  beforeEach(() => {
    (escapeStringRegexp as jest.Mock).mockImplementation((str) => str);
  });

  describe('group filtering', () => {
    it('returns all projects if selectedGroupPath is null', () => {
      const result = filterProjects(projects, '', null);
      expect(result).toEqual(projects);
    });

    it('filters projects by groupPath', () => {
      const result = filterProjects(projects, '', 'group1');
      expect(result).toEqual([
        { name: 'Alpha', groupPath: 'group1' },
        { name: 'Gamma', groupPath: 'group1' },
        { name: 'alphabet', groupPath: 'group1' },
      ]);
    });

    it('returns empty array if no projects match groupPath', () => {
      const result = filterProjects(projects, '', 'nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('search filtering', () => {
    it('returns all projects if searchValue is less than 3 characters', () => {
      const result = filterProjects(projects, 'Al', null);
      expect(result).toEqual(projects);
    });

    it('filters projects by searchValue (case-insensitive, >=3 chars)', () => {
      const result = filterProjects(projects, 'alp', null);
      expect(result).toEqual([
        { name: 'Alpha', groupPath: 'group1' },
        { name: 'alphabet', groupPath: 'group1' },
      ]);
    });

    it('filters projects by searchValue and groupPath together', () => {
      const result = filterProjects(projects, 'alp', 'group1');
      expect(result).toEqual([
        { name: 'Alpha', groupPath: 'group1' },
        { name: 'alphabet', groupPath: 'group1' },
      ]);
    });

    it('returns empty array if no projects match search', () => {
      const result = filterProjects(projects, 'zzz', null);
      expect(result).toEqual([]);
    });

    it('returns empty array if no projects match both filters', () => {
      const result = filterProjects(projects, 'alp', 'group2');
      expect(result).toEqual([]);
    });
  });
});
