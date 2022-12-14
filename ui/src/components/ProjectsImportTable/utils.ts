import escapeStringRegexp from 'escape-string-regexp';
import { ProjectImportSelection } from '../../services/types';

export const compose = <R>(fn1: (a: R) => R, ...fns: Array<(a: R) => R>) =>
  fns.reduce((prevFn, nextFn) => (value) => prevFn(nextFn(value)), fn1);

const getGroupsFilteredProjects = (selectedGroupPath: string | null) => (projects: ProjectImportSelection[]) => {
  if (!selectedGroupPath) {
    return projects;
  }

  return projects.filter(({ groupPath }) => groupPath === selectedGroupPath);
};

const getSearchedProjects = (searchValue: string) => (projects: ProjectImportSelection[]) => {
  if (searchValue.length < 3) {
    return projects;
  }

  return projects.filter((project) => {
    return new RegExp(escapeStringRegexp(searchValue), 'gi').test(project.name);
  });
};

export const filterProjects = (
  projects: ProjectImportSelection[],
  searchValue: string,
  selectedGroupPath: string | null,
): ProjectImportSelection[] => {
  return compose(getGroupsFilteredProjects(selectedGroupPath), getSearchedProjects(searchValue))(projects);
};
