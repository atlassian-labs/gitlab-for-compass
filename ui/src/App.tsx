import { AppRouter } from './AppRouter';
import { AppContextProvider } from './context/AppContext';
import { ImportContextProvider } from './context/ImportContext';

export const App = () => {
  return (
    <AppContextProvider>
      <ImportContextProvider>
        <AppRouter />
      </ImportContextProvider>
    </AppContextProvider>
  );
};
