import { Route, MemoryRouter, Routes } from 'react-router-dom';

import { useEffect } from 'react';
import { ConnectedPage } from './components/ConnectedPage';
import { AuthPage } from './components/AuthPage';
import { SelectImportPage } from './components/SelectImportPage';
import { ImportProgressResultPage } from './components/ImportProgressResultPage';
import { useAppContext } from './hooks/useAppContext';
import { ApplicationState, ROUTES } from './routes';
import { IMPORT_MODULE_KEY } from './constants';
import { ImportAllPage } from './components/ImportAll';
import { checkOnboardingRedirection, isRenderingInOnboardingFlow } from './components/onboarding-flow-context-helper';

export const AppRouter = () => {
  const { initialRoute, moduleKey } = useAppContext();

  useEffect(() => {
    const processAsync = async () => {
      const isOnboarding = await isRenderingInOnboardingFlow();
      if (isOnboarding) {
        await checkOnboardingRedirection().catch((e) => {
          console.error(`Failed to redirect to the next onboarding step: ${e}`);
        });
      }
    };

    if (initialRoute === ApplicationState.CONNECTED) {
      processAsync().catch((e) => console.error(`Failed to get onboarding status: ${e}`));
    }
  }, [initialRoute]);

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
            <Route {...ROUTES.importAll} element={<ImportAllPage />} />
            <Route {...ROUTES.Import} element={<SelectImportPage />} />
            <Route {...ROUTES.ImportProgress} element={<ImportProgressResultPage moduleKey={moduleKey} />} />
          </Routes>
        </MemoryRouter>
      )}
    </>
  );
};
