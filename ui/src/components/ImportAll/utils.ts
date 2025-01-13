import { IMPORT_STATE } from '../../hooks/useImportAll';

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
