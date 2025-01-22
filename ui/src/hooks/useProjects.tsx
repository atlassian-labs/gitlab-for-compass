import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { ProjectImportSelection } from '../services/types';
import { getComponentTypeOptionForBuiltInType } from '../components/utils';

type UseProjectsReturnType = {
  changedProjects: ProjectImportSelection[];
  setChangedProjects: Dispatch<SetStateAction<ProjectImportSelection[]>>;
};

export const useProjects = (projects: ProjectImportSelection[]): UseProjectsReturnType => {
  const [changedProjects, setChangedProjects] = useState<ProjectImportSelection[]>([]);

  useEffect(() => {
    if (projects.length !== 0) {
      projects.forEach((project) => {
        const itemInChangedList = changedProjects.find((changedProject) => changedProject.id === project.id);

        const isSelectedItemExists = Boolean(itemInChangedList);
        const isComponentTypeChanged = itemInChangedList
          ? JSON.stringify(itemInChangedList.typeOption) !== JSON.stringify(project.typeOption)
          : false;
        const isSelectChanged = itemInChangedList ? itemInChangedList.isSelected !== project.isSelected : false;
        const isProjectChanged = project.isSelected || isComponentTypeChanged;
        const isProjectUpdated = isSelectChanged || isComponentTypeChanged;

        const shouldAddProjectToList = !isSelectedItemExists && isProjectChanged;
        const shouldUpdateProjectInList = itemInChangedList && isProjectUpdated;

        if (shouldUpdateProjectInList) {
          setChangedProjects((prevState) =>
            prevState.map((el) =>
              el.id === itemInChangedList.id
                ? {
                    ...el,
                    typeOption: project.typeOption,
                    isSelected: project.isSelected,
                    ownerTeamOption: project.ownerTeamOption,
                  }
                : el,
            ),
          );
          return;
        }

        if (shouldAddProjectToList) {
          setChangedProjects((prevState) => [
            ...prevState,
            {
              ...project,
              typeOption: project.typeOption || getComponentTypeOptionForBuiltInType(project.typeId),
              ownerTeamOption: project.ownerTeamOption,
            },
          ]);
        }
      });
    }
  }, [projects]);

  return { changedProjects, setChangedProjects };
};
