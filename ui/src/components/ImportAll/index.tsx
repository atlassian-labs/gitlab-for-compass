import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImportAllScreen } from '../../constants';
import { InfoScreen } from './InfoScreen';
import { ProgressScreen } from './ProgressScreen';
import { ApplicationState } from '../../routes';

export const ImportAllPage = () => {
  const [screen, setScreen] = useState(ImportAllScreen.INFO);
  const navigate = useNavigate();

  const handleRedirectToConnectedPage = () => {
    navigate(`..${ApplicationState.CONNECTED}`, { replace: true });
  };

  const handleRedirectToProgressScreen = () => {
    setScreen(ImportAllScreen.PROGRESS);
  };

  const handleRedirectToInfoScreen = () => {
    setScreen(ImportAllScreen.INFO);
  };

  return (
    <div>
      {screen === ImportAllScreen.INFO ? (
        <InfoScreen
          handleRedirectToConnectedPage={handleRedirectToConnectedPage}
          handleRedirectToProgressScreen={handleRedirectToProgressScreen}
        />
      ) : (
        <ProgressScreen
          handleRedirectToInfoScreen={handleRedirectToInfoScreen}
          handleRedirectToConnectedPage={handleRedirectToConnectedPage}
        />
      )}
    </div>
  );
};
