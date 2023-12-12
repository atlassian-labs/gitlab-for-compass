import { view } from '@forge/bridge';
import { AppRouter } from './AppRouter';
import { AppContextProvider } from './context/AppContext';
import { ImportContextProvider } from './context/ImportContext';

export const App = () => {
  view.theme.enable();

  return (
    <AppContextProvider>
      <ImportContextProvider>
        <AppRouter />
      </ImportContextProvider>
    </AppContextProvider>
  );
};
