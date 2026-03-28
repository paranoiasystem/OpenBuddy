import type { AppResult } from '@shared/result.js'

/** Output port: persistence contract for the Google OAuth2 token. */
export type IGoogleTokenStore = {
  /** Loads the stored token, or undefined if none exists. */
  load(): Promise<AppResult<Record<string, unknown> | undefined>>
  /** Persists the token, overwriting any previous value. */
  save(token: Record<string, unknown>): Promise<AppResult<void>>
}
