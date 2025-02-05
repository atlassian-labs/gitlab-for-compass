import { useContext } from 'react';
import { ImportAllCaCContext, ImportAllCaCContextType } from '../context/ImportAllCaCContext';

export const useImportAllCaCContext = (): ImportAllCaCContextType => useContext(ImportAllCaCContext);
