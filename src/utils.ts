export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};
export const getErrorMessage = (error: unknown): string | undefined => {
  return isError(error) ? error.message : undefined;
};
