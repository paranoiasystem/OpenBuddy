/** Checks if a Google API error is an authentication error (401/403). */
export function isAuthError(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false
  const obj = e as Record<string, unknown>
  const code = obj['code']
  const status = (obj['response'] as Record<string, unknown> | undefined)?.['status']
  return code === 401 || code === 403 || status === 401 || status === 403
}

/** Extract human-readable fields from Google API (GaxiosError) for structured logging. */
export function serializeApiError(cause: unknown): Record<string, unknown> {
  if (typeof cause !== 'object' || cause === null) return { cause: String(cause) }
  const obj = cause as Record<string, unknown>
  const response = obj['response'] as Record<string, unknown> | undefined
  return {
    message: obj['message'] ?? String(cause),
    status: response?.['status'] ?? obj['code'],
    data: response?.['data'],
  }
}
