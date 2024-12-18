import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { router } from '@forge/bridge';

import SectionMessage from '@atlaskit/section-message';
import { Field, FormFooter } from '@atlaskit/form';
import Textfield from '@atlaskit/textfield';
import Button, { ButtonGroup, LoadingButton } from '@atlaskit/button';
import WatchIcon from '@atlaskit/icon/glyph/watch';
import WatchFilledIcon from '@atlaskit/icon/glyph/watch-filled';
import { RadioGroup } from '@atlaskit/radio';

import { getCallBridge } from '@forge/bridge/out/bridge';
import CopyIcon from '@atlaskit/icon/core/copy';
import Tooltip from '@atlaskit/tooltip';
import { ApplicationState } from '../../routes';
import { ForgeLink } from '../ForgeLink';
import { connectGroup, connectInProgressWebhook, disconnectGroup } from '../../services/invokes';
import { ErrorMessages } from '../../errorMessages';
import { AuthErrorTypes, ErrorTypes } from '../../resolverTypes';
import { useAppContext } from '../../hooks/useAppContext';
import { IncomingWebhookSectionMessage } from '../IncomingWebhookSectionMessage';
import { GitLabRoles } from '../../types';
import { CopyIconWrapper, FormWrapper, ReloadButtonWrapper, SectionMessageWrapper, TokenRoleWrapper } from './styles';

const buildValidationMethod = (errorType: ErrorTypes) => {
  switch (errorType) {
    case AuthErrorTypes.INVALID_GROUP_TOKEN:
      return (
        <SectionMessage
          testId='incorrect-token-message'
          appearance='error'
          title={ErrorMessages[AuthErrorTypes.INVALID_GROUP_TOKEN].title}
        >
          <p>
            {ErrorMessages[AuthErrorTypes.INVALID_GROUP_TOKEN].description[0]}
            <strong>{ErrorMessages[AuthErrorTypes.INVALID_GROUP_TOKEN].description[1]}</strong>
            {ErrorMessages[AuthErrorTypes.INVALID_GROUP_TOKEN].description[2]}
          </p>
        </SectionMessage>
      );
    case AuthErrorTypes.INVALID_GROUP_TOKEN_NAME:
      return (
        <SectionMessage
          testId='incorrect-token-name-message'
          appearance='warning'
          title={ErrorMessages[AuthErrorTypes.INVALID_GROUP_TOKEN_NAME].title}
        >
          <p>{ErrorMessages[AuthErrorTypes.INVALID_GROUP_TOKEN_NAME].description}</p>
        </SectionMessage>
      );
    case AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES:
      return (
        <SectionMessage
          testId='incorrect-token-scopes-message'
          appearance='warning'
          title={ErrorMessages[AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES].title}
        >
          <p>
            {ErrorMessages[AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES].description[0]}
            <strong>{ErrorMessages[AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES].description[1]}</strong>
            {ErrorMessages[AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES].description[2]}
            <strong>{ErrorMessages[AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES].description[3]}</strong>
            {ErrorMessages[AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES].description[4]}
          </p>
        </SectionMessage>
      );
    default:
      return (
        <SectionMessage
          testId='unexpected-message'
          appearance='error'
          title={ErrorMessages[AuthErrorTypes.UNEXPECTED_ERROR].title}
        >
          <p>{ErrorMessages[AuthErrorTypes.UNEXPECTED_ERROR].description}</p>
          <ReloadButtonWrapper>
            <Button appearance='link' onClick={() => router.reload()}>
              Reload
            </Button>
          </ReloadButtonWrapper>
        </SectionMessage>
      );
  }
};

export const AuthPage = () => {
  const [tokenName, setTokenName] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [isLoadingConnectGroup, setLoadingConnectGroup] = useState<boolean>(false);
  const [isLoadingConnectWebhook, setLoadingConnectWebhook] = useState<boolean>(false);
  const [isLoadingDisconnect, setLoadingDisconnect] = useState<boolean>(false);
  const [webhookCopyTooltipContent, setWebhookCopyTooltipContent] = useState('Copy Webhook URL');
  const [errorType, setErrorType] = useState<ErrorTypes | null>(null);
  const [isTokenVisible, setIsTokenVisible] = useState<boolean>(false);
  const [isWebhookTokenVisible, setIsWebhookTokenVisible] = useState<boolean>(false);
  const [webhookSecretToken, setWebhookSecretToken] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>(GitLabRoles.OWNER);
  const [groupName, setGroupName] = useState<string>('');
  const [webhookId, setWebhookId] = useState<string>('');
  const { appId, features, webhookSetupConfig, refreshWebhookConfig, clearGroup } = useAppContext();

  const isWebhookSetupInProgress =
    webhookSetupConfig.webhookSetupInProgress && webhookSetupConfig.groupId !== undefined;

  const navigate = useNavigate();

  const fireAppConfiguredAnalytic = async () => {
    const action = 'configured';
    const actionSubject = 'compassApp';
    await getCallBridge()('fireForgeAnalytic', {
      forgeAppId: appId,
      analyticEvent: `${actionSubject} ${action}`,
    });
  };

  const handleNavigateToConnectedPage = () => {
    navigate(`..${ApplicationState.CONNECTED}`, { replace: true });
  };

  const handleConnectGroup = async (): Promise<void> => {
    setLoadingConnectGroup(true);

    try {
      const { success, errors } = await connectGroup(token.trim(), tokenName, groupName, selectedRole);

      if (success) {
        await fireAppConfiguredAnalytic();
        await refreshWebhookConfig();

        if (features.isGitlabMaintainerTokenEnabled && selectedRole === GitLabRoles.OWNER) {
          handleNavigateToConnectedPage();
        }
      } else {
        setErrorType((errors && errors[0].errorType) || AuthErrorTypes.UNEXPECTED_ERROR);
      }

      setLoadingConnectGroup(false);
    } catch (err) {
      setLoadingConnectGroup(false);
      setErrorType(AuthErrorTypes.UNEXPECTED_ERROR);
    }
  };

  const handleConnectWebhook = async (): Promise<void> => {
    setLoadingConnectWebhook(true);

    try {
      if (webhookSetupConfig.groupId === undefined || webhookSetupConfig.groupId === null) {
        throw new Error('Group ID is undefined during in-progress webhook setup');
      }

      const { success, errors } = await connectInProgressWebhook(
        webhookSetupConfig.groupId,
        webhookId,
        webhookSecretToken,
      );

      if (success) {
        await fireAppConfiguredAnalytic();
        await refreshWebhookConfig();
        handleNavigateToConnectedPage();
      } else {
        setErrorType((errors && errors[0].errorType) || AuthErrorTypes.UNEXPECTED_ERROR);
      }

      setLoadingConnectWebhook(false);
    } catch (err) {
      setLoadingConnectWebhook(false);
      setErrorType(AuthErrorTypes.UNEXPECTED_ERROR);
    }
  };

  const handleDisconnectGroup = async (id?: number) => {
    if (id === undefined || id === null) {
      return;
    }

    setLoadingDisconnect(true);
    try {
      const { success, errors } = await disconnectGroup(id);
      clearGroup(id);

      if (success) {
        setLoadingDisconnect(false);
        await refreshWebhookConfig();
      }
      if (errors && errors.length > 0) {
        setLoadingDisconnect(false);
        setErrorType(errors[0].errorType || AuthErrorTypes.UNEXPECTED_ERROR);
      }
    } catch (err) {
      setErrorType(AuthErrorTypes.UNEXPECTED_ERROR);
    } finally {
      setLoadingDisconnect(false);
    }
  };

  const tokenNameOnChange = (e: React.FormEvent<HTMLInputElement>) => {
    if (errorType) {
      setErrorType(null);
    }
    setTokenName(e.currentTarget.value);
  };

  const tokenOnChange = (e: React.FormEvent<HTMLInputElement>) => {
    if (errorType) {
      setErrorType(null);
    }
    setToken(e.currentTarget.value);
  };

  const toggleTokenView = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();

    setIsTokenVisible(!isTokenVisible);
  };

  const toggleWebhookTokenView = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setIsWebhookTokenVisible(!isWebhookTokenVisible);
  };

  const isConnectGroupBtnDisabled = !tokenName || !token || (selectedRole === GitLabRoles.MAINTAINER && !groupName);

  const isConnectWebhookBtnDisabled = !webhookSecretToken || !webhookId;

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (errorType) {
      setErrorType(null);
    }
    setSelectedRole(e.target.value);
  };

  const handleGroupNameChange = (e: React.FormEvent<HTMLInputElement>) => {
    if (errorType) {
      setErrorType(null);
    }
    setGroupName(e.currentTarget.value);
  };

  const handleWebhookSecretTokenChange = (e: React.FormEvent<HTMLInputElement>) => {
    if (errorType) {
      setErrorType(null);
    }
    setWebhookSecretToken(e.currentTarget.value);
  };

  const handleWebhookIdChange = (e: React.FormEvent<HTMLInputElement>) => {
    if (errorType) {
      setErrorType(null);
    }
    setWebhookId(e.currentTarget.value);
  };

  const handleWebhookUrlCopy = useCallback(() => {
    console.log('Copying webhook URL', webhookSetupConfig.triggerUrl);
    return navigator.clipboard
      .writeText(webhookSetupConfig.triggerUrl)
      .then(() => {
        setWebhookCopyTooltipContent('Copied');
        return setTimeout(() => {
          setWebhookCopyTooltipContent('Copy Webhook URL');
        }, 5000);
      })
      .catch(() => {
        console.log('Error copying webhook URL');
      });
  }, [webhookSetupConfig]);

  const ConnectionMessage = () =>
    features.isGitlabMaintainerTokenEnabled && selectedRole === GitLabRoles.MAINTAINER ? (
      <SectionMessageWrapper>
        <p>
          You can connect only one GitLab group to Compass at a time. Create and retrieve a group access token from your
          GitLab account to connect to Compass. When creating your token:
        </p>
        <ul>
          <li>don't set any expiration date</li>
          <li>
            select <b>Maintainer</b> as the role
          </li>
          <li>
            select the <b>api</b> and <b>write_repository</b> scopes
          </li>
        </ul>
        <p>
          <ForgeLink
            to='https://docs.gitlab.com/ee/user/group/settings/group_access_tokens.html#create-a-group-access-token-using-ui'
            openInNewTab
          >
            Learn more about group access tokens
          </ForgeLink>
        </p>
      </SectionMessageWrapper>
    ) : (
      <SectionMessageWrapper>
        <p>
          You can connect only one GitLab group to Compass at a time, and you must be an owner of that group. Create and
          retrieve a group access token from your GitLab account to connect to Compass. When creating your token:
        </p>
        <ul>
          <li>don't set any expiration date</li>
          <li>
            select <b>Owner</b> as the role
          </li>
          <li>
            select the <b>api</b> and <b>write_repository</b> scopes
          </li>
        </ul>
        <p>
          <ForgeLink
            to='https://docs.gitlab.com/ee/user/group/settings/group_access_tokens.html#create-a-group-access-token-using-ui'
            openInNewTab
          >
            Learn more about group access tokens
          </ForgeLink>
        </p>
      </SectionMessageWrapper>
    );

  const WebhookCopyButton = () => (
    <Tooltip content={webhookCopyTooltipContent} testId='webhook-url-copy-tooltip' position='top-end'>
      <Button
        appearance='link'
        spacing='compact'
        onClick={handleWebhookUrlCopy}
        iconAfter={<CopyIcon label='Copy webhook URL' />}
      >
        {webhookSetupConfig.triggerUrl}
      </Button>
    </Tooltip>
  );

  const WebhookSetupMessage = () => (
    <SectionMessageWrapper data-testid='webhooks-setup-message'>
      <h4>Finish setting up your webhook with Maintainer Token</h4>
      <p>
        To complete the setup, you need to manually create a webhook in your GitLab group following the steps below:
      </p>

      <ul>
        <li>
          Create new webhook by copying the URL: <WebhookCopyButton />
        </li>
        <li>Add a secret token for webhook and input the same below</li>
        <li>
          For webhook triggers, select <b>Push events</b>, <b>Merge request events</b>, <b>Pipeline events</b> and{' '}
          <b>Deployment events</b>
        </li>
        <li>
          Ensure that <b>Enable SSL Verification</b> is checked
        </li>
        <li>
          Webhook ID can be found as part of the URL when in edit mode <br />
          Example: https://gitlab.com/.../-/hooks/<b>webhook_id</b>/edit
        </li>
      </ul>
    </SectionMessageWrapper>
  );

  return (
    <div data-testid='gitlab-auth-page'>
      {isWebhookSetupInProgress ? (
        <WebhookSetupMessage />
      ) : (
        <>
          <SectionMessageWrapper data-testid='token-setup-message'>
            <h4>Connect group with {selectedRole} Token</h4>
          </SectionMessageWrapper>
          <TokenRoleWrapper>
            {features.isGitlabMaintainerTokenEnabled && (
              <Field label='Token Role' name='tokenRole' isRequired>
                {({ fieldProps }) => (
                  <RadioGroup
                    {...fieldProps}
                    value={selectedRole}
                    options={[
                      { name: 'role', value: GitLabRoles.OWNER, label: 'Owner' },
                      { name: 'role', value: GitLabRoles.MAINTAINER, label: 'Maintainer' },
                    ]}
                    onChange={handleRoleChange}
                  />
                )}
              </Field>
            )}
          </TokenRoleWrapper>
          <ConnectionMessage />
          <IncomingWebhookSectionMessage isMaintainerTokenEnabled={features.isGitlabMaintainerTokenEnabled} />
        </>
      )}

      <br />
      {errorType && buildValidationMethod(errorType)}

      {!webhookSetupConfig.webhookSetupInProgress && (
        <FormWrapper>
          <h5>Group access token</h5>
          <Field label='Token Name' name='accessTokenName' isRequired>
            {({ fieldProps }) => (
              <>
                <Textfield {...fieldProps} isCompact onChange={tokenNameOnChange} testId='access-token-name' />
              </>
            )}
          </Field>
          <Field label='Token' name='accessToken' isRequired>
            {({ fieldProps }) => (
              <Textfield
                {...fieldProps}
                isCompact
                onChange={tokenOnChange}
                testId='group-access-token'
                type={isTokenVisible ? 'text' : 'password'}
                elemAfterInput={
                  <Button
                    onClick={(e) => toggleTokenView(e)}
                    iconBefore={
                      isTokenVisible ? (
                        <WatchFilledIcon size='medium' label='watch-filled-icon' />
                      ) : (
                        <WatchIcon size='medium' label='watch-icon' />
                      )
                    }
                    appearance='subtle'
                  />
                }
              />
            )}
          </Field>

          {features.isGitlabMaintainerTokenEnabled && selectedRole === GitLabRoles.MAINTAINER && (
            <>
              <Field label='Group Name' name='groupName' isRequired>
                {({ fieldProps }) => (
                  <Textfield {...fieldProps} onChange={handleGroupNameChange} isCompact testId='group-name' />
                )}
              </Field>
            </>
          )}

          <FormFooter align='start'>
            <LoadingButton
              onClick={handleConnectGroup}
              type='submit'
              isDisabled={isConnectGroupBtnDisabled}
              appearance='primary'
              isLoading={isLoadingConnectGroup}
              alt='Connect project'
              testId='connect-group-button'
            >
              {features.isGitlabMaintainerTokenEnabled && selectedRole === GitLabRoles.MAINTAINER ? 'Next' : 'Connect'}
            </LoadingButton>
          </FormFooter>
        </FormWrapper>
      )}

      {features.isGitlabMaintainerTokenEnabled && isWebhookSetupInProgress && (
        <FormWrapper>
          <h5>Webhook setup</h5>

          <Field label='Webhook ID' name='webhookId' isRequired>
            {({ fieldProps }) => (
              <Textfield
                {...fieldProps}
                isCompact
                onChange={handleWebhookIdChange}
                testId='webhook-id'
                value={webhookId}
              />
            )}
          </Field>
          <Field label='Webhook Secret Token' name='webhookSecretToken' isRequired>
            {({ fieldProps }) => (
              <Textfield
                {...fieldProps}
                isCompact
                onChange={handleWebhookSecretTokenChange}
                testId='webhook-secret-token'
                type={isWebhookTokenVisible ? 'text' : 'password'}
                elemAfterInput={
                  <Button
                    onClick={(e) => toggleWebhookTokenView(e)}
                    iconBefore={
                      isWebhookTokenVisible ? (
                        <WatchFilledIcon size='medium' label='watch-filled-icon' />
                      ) : (
                        <WatchIcon size='medium' label='watch-icon' />
                      )
                    }
                    appearance='subtle'
                  />
                }
              />
            )}
          </Field>

          <FormFooter align='start'>
            <ButtonGroup>
              <LoadingButton
                onClick={() => handleDisconnectGroup(webhookSetupConfig.groupId)}
                type='submit'
                appearance='warning'
                isLoading={isLoadingDisconnect}
                alt='Disconnect project'
                testId='cancel-webhook-button'
              >
                Cancel
              </LoadingButton>

              <LoadingButton
                onClick={handleConnectWebhook}
                type='submit'
                isDisabled={isConnectWebhookBtnDisabled}
                appearance='primary'
                isLoading={isLoadingConnectWebhook}
                alt='Connect project webhook'
                testId='connect-webhook-button'
              >
                Connect
              </LoadingButton>
            </ButtonGroup>
          </FormFooter>
        </FormWrapper>
      )}
    </div>
  );
};
