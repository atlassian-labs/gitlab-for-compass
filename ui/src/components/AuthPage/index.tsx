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
        <SectionMessage appearance='information'>
          <p>
            Create and retrieve your group access token from your GitLab account to connect to Compass. When creating
            your group access token, make sure you:
          </p>
          <ul>
            <li>do not set expiration date, leave it empty</li>
            <li>select an owner role for the token</li>
            <li>set required scopes for the token to “api” and “write_repository”</li>
            <li>have GitLab owner permissions for the group you want to connect</li>
          </ul>
          <p>
            <ForgeLink
              to='https://docs.gitlab.com/ee/user/group/settings/group_access_tokens.html#create-a-group-access-token-using-ui'
              openInNewTab
            >
              Learn more about group access tokens
            </ForgeLink>
          </p>
        </SectionMessage>
      </SectionMessageWrapper>

      {errorType && buildValidationMethod(errorType)}

      <FormWrapper>
        <Field label='Group access token' name='accessToken' isRequired>
          {({ fieldProps }) => (
            <Textfield
              {...fieldProps}
              isCompact
              placeholder='Enter your group access token'
              onChange={tokenOnChange}
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
        <Field label='Group access token name' name='accessTokenName' isRequired>
          {({ fieldProps }) => (
            <>
              <Textfield
                {...fieldProps}
                isCompact
                placeholder='Enter your group token name'
                onChange={tokenNameOnChange}
              />
              <HelperMessage>Note: The name of the token must be the same as it is in GitLab</HelperMessage>
            </>
          )}
        </Field>
        <FormFooter align='start'>
          <LoadingButton
            onClick={handleSubmit}
            type='submit'
            isDisabled={isSubmitBtnDisabled}
            appearance='primary'
            isLoading={isLoadingSubmit}
          >
            Connect group
          </LoadingButton>
        </FormFooter>
      </FormWrapper>
    </div>
  );
};
