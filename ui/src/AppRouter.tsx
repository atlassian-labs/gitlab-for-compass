import { Route, MemoryRouter, Routes } from 'react-router-dom';

import { ConnectedPage } from './components/ConnectedPage';
import { AuthPage } from './components/AuthPage';
import { SelectImportPage } from './components/SelectImportPage';
import { ImportProgressResultPage } from './components/ImportProgressResultPage';
import { useAppContext } from './hooks/useAppContext';
import { ApplicationState, ROUTES } from './routes';
import { IMPORT_MODULE_KEY } from './constants';

export const AppRouter = () => {
  const { initialRoute, moduleKey } = useAppContext();

  return moduleKey === IMPORT_MODULE_KEY ? (
    <>
      {
        <MemoryRouter initialEntries={[`${ApplicationState.CONNECTED}/import`]}>
          <Routes>
            <Route {...ROUTES.Import} element={<SelectImportPage />} />
            <Route {...ROUTES.ImportProgress} element={<ImportProgressResultPage moduleKey={moduleKey} />} />
          </Routes>
        </MemoryRouter>
      }
    </>
  ) : (
    <>
      {initialRoute && (
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route {...ROUTES[ApplicationState.AUTH]} element={<AuthPage />} />
            <Route {...ROUTES[ApplicationState.CONNECTED]} element={<ConnectedPage />} />
            <Route {...ROUTES.Import} element={<SelectImportPage />} />
            <Route {...ROUTES.ImportProgress} element={<ImportProgressResultPage moduleKey={moduleKey} />} />
          </Routes>
        </MemoryRouter>
      )}
    </>
  );
};
