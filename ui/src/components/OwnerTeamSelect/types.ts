export type SelectOwnerTeamOption = {
  label: string;
  value: string;
  iconUrl: string;
};

type InputActionTypes = 'set-value' | 'input-change' | 'input-blur' | 'menu-close';

export type InputActionMeta = {
  action: InputActionTypes;
};
