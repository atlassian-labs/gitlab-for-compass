import { useContext } from 'react';
import { ImportContext, ImportContextType } from '../context/ImportContext';

export const useImportContext = (): ImportContextType => useContext(ImportContext);
