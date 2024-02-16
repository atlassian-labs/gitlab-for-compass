import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { router } from '@forge/bridge';

import SectionMessage from '@atlaskit/section-message';
import { Field, FormFooter, HelperMessage } from '@atlaskit/form';
import Textfield from '@atlaskit/textfield';
import Button, { LoadingButton } from '@atlaskit/button';
import { gridSize } from '@atlaskit/theme';
import WatchIcon from '@atlaskit/icon/glyph/watch';
import WatchFilledIcon from '@atlaskit/icon/glyph/watch-filled';

import { getCallBridge } from '@forge/bridge/out/bridge';
import { ApplicationState } from '../../routes';
import { ForgeLink } from '../ForgeLink';
import { connectGroup } from '../../services/invokes';
import { ErrorMessages } from '../../errorMessages';
import { AuthErrorTypes, ErrorTypes } from '../../resolverTypes';
import { useAppContext } from '../../hooks/useAppContext';
import { IncomingWebhookSectionMessage } from '../IncomingWebhookSectionMessage';

const SectionMessageWrapper = styled.div`
  margin-bottom: ${gridSize() * 2}px;
`;

const FormWrapper = styled.div`
  width: 350px;
`;

const ReloadButtonWrapper = styled.div`
  > button {
    padding: 0;
  }
`;

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
  const [isLoadingSubmit, setLoadingSubmit] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<ErrorTypes | null>(null);
  const [isTokenVisible, setIsTokenVisible] = useState<boolean>(false);
  const { appId } = useAppContext();

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

  const handleSubmit = async (): Promise<void> => {
    setLoadingSubmit(true);

    try {
      const { success, errors } = await connectGroup(token.trim(), tokenName);

      if (success) {
        await fireAppConfiguredAnalytic();
        handleNavigateToConnectedPage();
      } else {
        setErrorType((errors && errors[0].errorType) || AuthErrorTypes.UNEXPECTED_ERROR);
      }

      setLoadingSubmit(false);
    } catch (err) {
      setLoadingSubmit(false);
      setErrorType(AuthErrorTypes.UNEXPECTED_ERROR);
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

  const isSubmitBtnDisabled = !tokenName || !token;

  return (
    <div data-testid='gitlab-auth-page'>
      <SectionMessageWrapper>
        <h4>Connect group</h4>
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
      <IncomingWebhookSectionMessage />
      <br />
      {errorType && buildValidationMethod(errorType)}

      <FormWrapper>
        <h5>Group access token</h5>
        <Field label='Name' name='accessTokenName' isRequired>
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
        <FormFooter align='start'>
          <LoadingButton
            onClick={handleSubmit}
            type='submit'
            isDisabled={isSubmitBtnDisabled}
            appearance='primary'
            isLoading={isLoadingSubmit}
            alt='Connect project'
          >
            Connect
          </LoadingButton>
        </FormFooter>
      </FormWrapper>
    </div>
  );
};
