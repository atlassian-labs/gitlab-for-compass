import { Box } from '@atlaskit/primitives';
import SectionMessage from '@atlaskit/section-message';
import { RadioGroup } from '@atlaskit/radio';
import { Field, FormFooter } from '@atlaskit/form';
import { useState } from 'react';
import Textfield from '@atlaskit/textfield';
import Button, { ButtonGroup, LoadingButton } from '@atlaskit/button';
import WatchIcon from '@atlaskit/icon/glyph/watch';
import WatchFilledIcon from '@atlaskit/icon/glyph/watch-filled';
import { router, showFlag } from '@forge/bridge';
import { ForgeLink } from '../ForgeLink';
import { FormWrapper, ReloadButtonWrapper, TokenRoleWrapper } from '../AuthPage/styles';
import { GitlabAPIGroup, GitLabRoles } from '../../types';
import { FeaturesList } from '../../features';
import { AuthErrorTypes, ErrorTypes, StoreTokenErrorTypes } from '../../resolverTypes';
import { rotateToken } from '../../services/invokes';
import { ErrorMessages } from './rotateTokenErrorMessages';

type Props = {
  features: FeaturesList;
  connectedGroup: GitlabAPIGroup;
};

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
    case StoreTokenErrorTypes.STORE_ERROR:
      return (
        <SectionMessage
          testId='store-token-failed-message'
          appearance='warning'
          title={ErrorMessages[StoreTokenErrorTypes.STORE_ERROR].title}
        >
          <p>{ErrorMessages[StoreTokenErrorTypes.STORE_ERROR].description}</p>
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

export const RotateGroupAccessToken = ({ features, connectedGroup }: Props) => {
  const [selectedRole, setSelectedRole] = useState<string>(GitLabRoles.OWNER);
  const [errorType, setErrorType] = useState<ErrorTypes | null>(null);
  const [tokenName, setTokenName] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [isTokenVisible, setIsTokenVisible] = useState<boolean>(false);
  const [isLoadingTokenRotation, setLoadingTokenRotation] = useState(false);

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (errorType) {
      setErrorType(null);
    }
    setSelectedRole(e.target.value);
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

  const cleanUpAllFields = () => {
    setSelectedRole(GitLabRoles.OWNER);
    setTokenName('');
    setToken('');
    setErrorType(null);
  };

  const handleRotateToken = async () => {
    setLoadingTokenRotation(true);

    try {
      const { success, errors } = await rotateToken(token.trim(), tokenName, connectedGroup.name, selectedRole);

      if (success) {
        cleanUpAllFields();
        showFlag({
          id: 'success-token-rotation-flag',
          title: 'Token successfully rotated',
          type: 'success',
          description: `Your GitLab group token was successfully rotated`,
          actions: [],
          isAutoDismiss: false,
        });
      } else {
        setErrorType((errors && errors[0].errorType) || AuthErrorTypes.UNEXPECTED_ERROR);
      }
    } catch (err) {
      setErrorType(AuthErrorTypes.UNEXPECTED_ERROR);
    } finally {
      setLoadingTokenRotation(false);
    }
  };

  const isRotateTokenBtnDisabled = !tokenName || !token;

  return (
    <Box testId='rotate-token-section' paddingBlockStart='space.100'>
      <h4>Rotate Group Access Token</h4>
      <Box paddingBlockStart='space.200'>
        <SectionMessage>
          <p>
            Your GitLab group is currently connected. Use the form below to change the Group Access Token used by
            Compass to access your organization. If you are creating a new group access token for Compass, remember to:
          </p>
          <ul>
            <li>
              select <b>Owner</b>{' '}
              {features.isGitlabMaintainerTokenEnabled && (
                <>
                  or <b>Maintainer</b>
                </>
              )}{' '}
              as the role
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
        </SectionMessage>
      </Box>

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

      <br />
      {errorType && buildValidationMethod(errorType)}

      <FormWrapper>
        <h5>Group access token</h5>
        <Field label='Token Name' name='accessTokenName' isRequired>
          {({ fieldProps }) => (
            <>
              <Textfield
                {...fieldProps}
                value={tokenName}
                isCompact
                onChange={tokenNameOnChange}
                testId='access-token-name'
              />
            </>
          )}
        </Field>
        <Field label='Token' name='accessToken' isRequired>
          {({ fieldProps }) => (
            <Textfield
              {...fieldProps}
              isCompact
              value={token}
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
          <ButtonGroup>
            <LoadingButton
              onClick={handleRotateToken}
              type='submit'
              isDisabled={isRotateTokenBtnDisabled}
              appearance='primary'
              isLoading={isLoadingTokenRotation}
              alt='Rotate token'
              testId='rotate-token-button'
            >
              Rotate token
            </LoadingButton>
          </ButtonGroup>
        </FormFooter>
      </FormWrapper>
    </Box>
  );
};
