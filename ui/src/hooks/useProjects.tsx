import { useEffect, useState } from 'react';
import { ProjectImportSelection } from '../services/types';
import { getComponentTypeOption } from '../components/utils';

export const useProjects = (projects: ProjectImportSelection[]): ProjectImportSelection[] => {
  const [selectedProjects, setSelectedProjects] = useState<ProjectImportSelection[]>([]);

  useEffect(() => {
    if (projects.length !== 0) {
      projects.forEach((project) => {
        const itemInSelectedList = selectedProjects.find((selectedProject) => selectedProject.id === project.id);
        const isSelectedItemExists = Boolean(itemInSelectedList);
        const shouldDeleteProjectFromList = isSelectedItemExists && !project.isSelected;
        const shouldAddProjectToList = !isSelectedItemExists && project.isSelected;
        const shouldUpdateProjectInList = itemInSelectedList && project.isSelected;

        if (shouldDeleteProjectFromList) {
          setSelectedProjects((prevState) => prevState.filter((selectedItem) => project.id !== selectedItem.id));
          return;
        }

        if (shouldUpdateProjectInList) {
          setSelectedProjects((prevState) =>
            prevState.map((el) => (el.id === itemInSelectedList.id ? { ...el, typeOption: project.typeOption } : el)),
          );
          return;
        }

        if (shouldAddProjectToList) {
          setSelectedProjects((prevState) => [
            ...prevState,
            {
              ...project,
              id: project.id,
              typeOption: project.typeOption || getComponentTypeOption(project.typeId),
            },
          ]);
        }
      });
    }
  }, [projects]);

  return selectedProjects;
};
