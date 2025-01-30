import { IncomingWebhookIcon, IncomingWebhookSectionWrapper } from './styles';
import WebhookIcon from './assets/WebhookIcon.svg';
import { ForgeLink } from './ForgeLink';
import { INCOMING_WEBHOOK_SETTINGS_PAGE_LINK } from '../constants';

type Props = {
  isMaintainerTokenEnabled?: boolean;
};

export const IncomingWebhookSectionMessage = ({ isMaintainerTokenEnabled = false }: Props) => {
  return (
    <IncomingWebhookSectionWrapper data-testid='incoming-webhook-information'>
      <IncomingWebhookIcon src={WebhookIcon} />
      <div>
        <p>
          If you're not a group owner{isMaintainerTokenEnabled ? '/maintainer' : ''} or use the self-managed version of
          GitLab, you can use{' '}
          <ForgeLink to={INCOMING_WEBHOOK_SETTINGS_PAGE_LINK} openInNewTab>
            incoming webhooks
          </ForgeLink>{' '}
          to connect GitLab to Compass instead.
        </p>
      </div>
    </IncomingWebhookSectionWrapper>
  );
};
