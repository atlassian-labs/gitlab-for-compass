import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { DynamicTableStateless } from '@atlaskit/dynamic-table';
import Spinner from '@atlaskit/spinner';
import { R400, G500 } from '@atlaskit/theme/colors';
import ErrorIcon from '@atlaskit/icon/glyph/error';
import CheckIcon from '@atlaskit/icon/glyph/check';

import SectionMessage from '@atlaskit/section-message';
import { buildHead } from './buildHead';
import { buildRows } from './buildRows';
import { ErrorInfo, ImportResultCounterWrapper, SuccessInfo } from './styles';
import { buildErrorState } from './buildErrorState';
import { useImportResult } from '../../hooks/useImportResult';
import { CenterWrapper, SectionWrapper, TableWrapper } from '../styles';
import { clearResult } from '../../services/invokes';
import { ErrorTypes, ImportErrorTypes } from '../../resolverTypes';

export const ImportResult: FunctionComponent = () => {
  const [error, setError] = useState<ErrorTypes | null>();
  const { failedProjects, totalProjects, isLoading, error: importResultError } = useImportResult();

  const rows = useMemo(() => buildRows({ failedProjects }), [failedProjects]);
  const errorState = useMemo(() => buildErrorState({ error: importResultError }), [error]);

  const clearImportResults = async () => {
    try {
      const { errors } = await clearResult();

      if (errors) {
        setError(errors[0].errorType || ImportErrorTypes.UNEXPECTED_ERROR);
      }
    } catch {
      setError(ImportErrorTypes.UNEXPECTED_ERROR);
    }
  };

  useEffect(() => {
    if (Boolean(failedProjects.length) || Boolean(totalProjects)) {
      clearImportResults();
    }
  }, [failedProjects, totalProjects]);

  if (isLoading) {
    return (
      <CenterWrapper>
        <Spinner size='large' />
      </CenterWrapper>
    );
  }

  if (error) {
    return (
      <SectionWrapper>
        <SectionMessage title='Something went wrong' appearance='information'>
          <p>Something went wrong! Try to reload a page.</p>
        </SectionMessage>
      </SectionWrapper>
    );
  }

  if (!failedProjects.length && !totalProjects) {
    return null;
  }

  const successInfoText =
    totalProjects > 1
      ? `${totalProjects} components are successfully imported.`
      : `${totalProjects} component is successfully imported.`;

  return (
    <>
      {failedProjects.length === 0 ? (
        <>
          <ImportResultCounterWrapper>
            <CheckIcon primaryColor={G500} label='Check icon' />
            <SuccessInfo>{successInfoText}</SuccessInfo>
          </ImportResultCounterWrapper>
        </>
      ) : (
        <>
          <ImportResultCounterWrapper>
            <ErrorIcon primaryColor={R400} label='Error icon' />
            <ErrorInfo>{failedProjects.length} components failed to import</ErrorInfo>
          </ImportResultCounterWrapper>
          <TableWrapper>
            <DynamicTableStateless isLoading={isLoading} head={buildHead()} rows={rows} emptyView={errorState} />
          </TableWrapper>
        </>
      )}
    </>
  );
};
