import { IncomingWebhookIcon, IncomingWebhookSectionWrapper } from './styles';
import WebhookIcon from './assets/WebhookIcon.svg';
import { ForgeLink } from './ForgeLink';
import { INCOMING_WEBHOOK_SETTINGS_PAGE_LINK } from '../constants';

export const IncomingWebhookSectionMessage = () => {
  return (
    <IncomingWebhookSectionWrapper>
      <IncomingWebhookIcon src={WebhookIcon} />
      <div>
        <p>
          If you're not a group owner or use the self-managed version of GitLab, you can use{' '}
          <ForgeLink to={INCOMING_WEBHOOK_SETTINGS_PAGE_LINK} openInNewTab>
            incoming webhooks
          </ForgeLink>{' '}
          to connect GitLab to Compass instead.
        </p>
      </div>
    </IncomingWebhookSectionWrapper>
  );
};
