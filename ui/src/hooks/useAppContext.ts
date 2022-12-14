import { useContext } from 'react';
import { AppContext, AppContextProps } from '../context/AppContext';

export const useAppContext = (): AppContextProps => useContext(AppContext);
