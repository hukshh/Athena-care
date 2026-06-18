/**
 * Safely extract a human-readable error message from any API error.
 * Handles FastAPI 422 validation errors, 400/401/500 errors, and network errors.
 */
export function extractErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback;

  const detail = error.response?.data?.detail;

  // FastAPI 422: detail is an array of validation error objects
  // e.g. [{type: "missing", loc: ["body", "email"], msg: "Field required", input: {...}}]
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        if (typeof d === 'string') return d;
        if (d?.msg) {
          const field = d.loc?.slice(-1)[0]; // last element is the field name
          return field ? `${field}: ${d.msg}` : d.msg;
        }
        return JSON.stringify(d);
      })
      .join(' · ');
  }

  // Standard string detail
  if (typeof detail === 'string') return detail;

  // Object detail with message
  if (detail?.message) return detail.message;

  // Network error
  if (error.message) return error.message;

  return fallback;
}
