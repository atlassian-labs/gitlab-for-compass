import { renderHook } from '@testing-library/react-hooks';
import { useProjects } from './useProjects';
import { ProjectImportSelection } from '../services/types';

jest.mock('../components/utils', () => ({
  getComponentTypeOptionForBuiltInType: jest.fn((typeId) => ({ label: `BuiltIn-${typeId}`, value: typeId })),
}));

describe('useProjects', () => {
  const baseProject = {
    id: 1,
    name: 'Repo 1',
    isSelected: false,
    typeId: 'service',
    typeOption: { label: 'Service', value: 'service' },
    ownerTeamOption: null,
    isManaged: false,
    isCompassFilePrOpened: false,
    hasComponent: false,
  } as ProjectImportSelection;

  it('returns empty changedProjects initially', () => {
    const { result } = renderHook(() => useProjects([]));
    expect(result.current.changedProjects).toEqual([]);
  });

  it('adds a selected project to changedProjects', () => {
    const selectedProject = { ...baseProject, isSelected: true };
    const { result } = renderHook(() => useProjects([selectedProject]));
    expect(result.current.changedProjects).toEqual([selectedProject]);
  });

  it('does not add an unselected project to changedProjects', () => {
    const { result } = renderHook(() => useProjects([baseProject]));
    expect(result.current.changedProjects).toEqual([]);
  });

  it('updates changedProjects when project selection changes', () => {
    const selectedProject = { ...baseProject, isSelected: true };
    const { result, rerender } = renderHook(({ projects }) => useProjects(projects), {
      initialProps: { projects: [selectedProject] },
    });
    expect(result.current.changedProjects).toEqual([selectedProject]);

    const deselectedProject = { ...selectedProject, isSelected: false };
    rerender({ projects: [deselectedProject] });

    expect(result.current.changedProjects).toEqual([{ ...selectedProject, isSelected: false }]);
  });

  it('updates changedProjects when typeOption changes', () => {
    const selectedProject = { ...baseProject, isSelected: true };
    const { result, rerender } = renderHook(({ projects }) => useProjects(projects), {
      initialProps: { projects: [selectedProject] },
    });
    expect(result.current.changedProjects).toEqual([selectedProject]);

    // Change typeOption
    const updatedProject = {
      ...selectedProject,
      typeOption: { label: 'Library', value: 'library' },
    };
    rerender({ projects: [updatedProject] });

    expect(result.current.changedProjects).toEqual([
      { ...selectedProject, typeOption: { label: 'Library', value: 'library' } },
    ]);
  });

  it('does not duplicate unchanged projects in changedProjects', () => {
    const selectedProject = { ...baseProject, isSelected: true };
    const { result, rerender } = renderHook(({ projects }) => useProjects(projects), {
      initialProps: { projects: [selectedProject] },
    });
    expect(result.current.changedProjects).toEqual([selectedProject]);

    rerender({ projects: [selectedProject] });
    expect(result.current.changedProjects).toEqual([selectedProject]);
  });
});
