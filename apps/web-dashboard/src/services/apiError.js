export function apiErrorMessage(error, fallback) {
  const details = error.response?.data;
  const fieldErrors = details?.errors
    ? Object.values(details.errors).flat().filter(Boolean)
    : [];
  return fieldErrors.join(' ') || details?.title || fallback;
}
