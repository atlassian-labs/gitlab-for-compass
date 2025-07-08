import { view } from '@forge/bridge';
import { useEffect, useState } from 'react';
import { AppRouter } from './AppRouter';
import { AppContextProvider } from './context/AppContext';
import { ImportContextProvider } from './context/ImportContext';
import { ComponentTypesContextProvider } from './context/ComponentTypesContext';
import { ImportAllCaCProvider } from './context/ImportAllCaCContext';
import { ROTATE_WEB_TRIGGER_MODAL } from './constants';
import { RotateWebtriggerModal } from './components/RotateWebtriggerModal';

type ExtensionData = {
  [key: string]: string | null;
};

export const App = () => {
  const [extensionContext, setExtensionContext] = useState<ExtensionData>();

  const enableTheme = async () => {
    await view.theme.enable().catch;
  };
  async function getContext() {
    const context = await view.getContext();
    setExtensionContext(context.extension);
  }

  useEffect(() => {
    enableTheme().catch((e) => {
      console.error('Error while enabling theme', e);
    });
    getContext().catch((e) => {
      console.error('Error while enabling theme', e);
    });
  }, []);

  if (extensionContext?.renderComponent === ROTATE_WEB_TRIGGER_MODAL) {
    return <RotateWebtriggerModal groupName={extensionContext.groupName} />;
  }

  return (
    <AppContextProvider>
      <ComponentTypesContextProvider>
        <ImportContextProvider>
          <ImportAllCaCProvider>
            <AppRouter />
          </ImportAllCaCProvider>
        </ImportContextProvider>
      </ComponentTypesContextProvider>
    </AppContextProvider>
  );
};
