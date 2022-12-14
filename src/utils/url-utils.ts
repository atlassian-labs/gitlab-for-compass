export const queryParamsGenerator = (params: { [key: string]: string }): string =>
  new URLSearchParams(params).toString();
