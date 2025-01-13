import SectionMessage from '@atlaskit/section-message';
import Button from '@atlaskit/button';
import { ButtonWrapper } from './styled';

export const InfoScreen = ({
  handleRedirectToProgressScreen,
  handleRedirectToConnectedPage,
}: {
  handleRedirectToProgressScreen: () => void;
  handleRedirectToConnectedPage: () => void;
}) => {
  return (
    <div>
      <h4 data-testId='info-screen-title'>This will import all projects as components.</h4>
      <SectionMessage appearance='information' testId='info-screen-information-message'>
        <p>Please keep your browser open till the import operation completes.</p>
        <p>
          Projects imported via this mechanism would not generate duplicates so you can retry this operation at a later
          time.
        </p>
      </SectionMessage>
      <ButtonWrapper>
        <Button appearance='primary' onClick={handleRedirectToProgressScreen} testId='info-screen-start-btn'>
          Start
        </Button>
        <Button onClick={handleRedirectToConnectedPage} testId='info-screen-back-btn'>
          Go back
        </Button>
      </ButtonWrapper>
    </div>
  );
};
