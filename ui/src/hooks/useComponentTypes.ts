import { useContext } from 'react';
import { ComponentTypesResult } from '../services/types';
import { ComponentTypesContext } from '../context/ComponentTypesContext';

export const useComponentTypes = (): ComponentTypesResult => {
  const { componentTypes } = useContext(ComponentTypesContext);

  return {
    componentTypesLoading: false,
    error: null,
    componentTypes,
  };
};
