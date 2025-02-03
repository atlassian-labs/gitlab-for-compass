import { CREATE_PR_STATE, IMPORT_STATE } from '../../hooks/useImportAll';

export const mapStateToColor = (importState?: IMPORT_STATE) => {
  switch (importState) {
    case IMPORT_STATE.SUCCESS:
      return 'color.text.success';
    case IMPORT_STATE.ALREADY_IMPORTED:
      return 'color.text.warning';
    case IMPORT_STATE.FAILED:
      return 'color.text.danger';
    default:
      return 'color.text.success';
  }
};

export const mapStateToText = (importState?: IMPORT_STATE) => {
  switch (importState) {
    case IMPORT_STATE.SUCCESS:
      return 'Successfully imported';
    case IMPORT_STATE.ALREADY_IMPORTED:
      return 'Already imported';
    case IMPORT_STATE.FAILED:
      return 'Import failed';
    default:
      return 'Successfully imported';
  }
};

export const mapPRCreationStateToColor = (prCreationState?: CREATE_PR_STATE) => {
  switch (prCreationState) {
    case CREATE_PR_STATE.SUCCESS:
      return 'color.text.success';
    case CREATE_PR_STATE.FAILED:
      return 'color.text.danger';
    default:
      return 'color.text.success';
  }
};

export const mapPRCreationStateToText = (prCreationState?: CREATE_PR_STATE) => {
  switch (prCreationState) {
    case CREATE_PR_STATE.SUCCESS:
      return 'Pull request successfully created';
    case CREATE_PR_STATE.FAILED:
      return 'Pull request creation failed';
    default:
      return 'Pull request successfully created';
  }
};
