import { view } from '@forge/bridge';
import Button, { ButtonGroup } from '@atlaskit/button';
import WarningIcon from '@atlaskit/icon/glyph/warning';
import { token } from '@atlaskit/tokens';
import { Y300 } from '@atlaskit/theme/colors';
import { IconWrapper, ModalHeaderWrapper, ModalBodyWrapper, ModalFooterWrapper } from './styled';

export const RotateWebtriggerModal = ({ groupName }: { groupName: string | null }) => {
  const onClose = async (shouldRotateWebTrigger?: boolean) => {
    await view.close(shouldRotateWebTrigger);
  };

  return (
    <div>
      <ModalHeaderWrapper>
        <IconWrapper>
          <WarningIcon label='' primaryColor={token('color.icon.warning', Y300)} />
        </IconWrapper>
        Rotate webhook
      </ModalHeaderWrapper>
      <ModalBodyWrapper>
        <p>
          The webhook URL for the <strong>{groupName}</strong> group will be rotated.
        </p>
        <p>
          Once rotated, the old URL will no longer work. It'll be automatically replaced with a new URL to prevent
          unauthorized access to Compass using the Gitlab app.
        </p>
      </ModalBodyWrapper>
      <ModalFooterWrapper>
        <ButtonGroup>
          <Button appearance='subtle' onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button appearance='warning' onClick={() => onClose(true)} autoFocus>
            Rotate
          </Button>
        </ButtonGroup>
      </ModalFooterWrapper>
    </div>
  );
};
