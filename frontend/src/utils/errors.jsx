/** Human-readable message for any error thrown by the API client or upload request. */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => error?.message || fallback;

/** Maps API validation details to { fieldName: message } for inline form errors. */
export const getFieldErrors = (error) => {
  if (!Array.isArray(error?.details)) return {};
  return error.details.reduce((fields, issue) => {
    const field = issue.path?.split('.')[0];
    return field && !fields[field] ? { ...fields, [field]: issue.message } : fields;
  }, {});
};
