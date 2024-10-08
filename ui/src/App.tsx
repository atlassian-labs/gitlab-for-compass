import { view } from '@forge/bridge';
import { useEffect } from 'react';
import { AppRouter } from './AppRouter';
import { AppContextProvider } from './context/AppContext';
import { ImportContextProvider } from './context/ImportContext';

export const App = () => {
  const enableTheme = async () => {
    await view.theme.enable().catch;
  };

  useEffect(() => {
    enableTheme().catch((e) => {
      console.error('Error while enabling theme', e);
    });
  }, []);

  return (
    <AppContextProvider>
      <ImportContextProvider>
        <AppRouter />
      </ImportContextProvider>
    </AppContextProvider>
  );
};
