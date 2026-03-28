import { randomBytes } from 'crypto'

import type { Credentials, OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'

import type { IGoogleTokenStore } from '@domain/ports/output/i-google-token-store.js'
import { GOOGLE_SCOPES } from '@shared/constants.js'
import { logger } from '@shared/logger.js'

type GoogleAuthConfig = {
  readonly clientId: string
  readonly clientSecret: string
  readonly redirectUri: string
}

/**
 * Manages the full Google OAuth2 lifecycle:
 * - Load/save token via an injected IGoogleTokenStore
 * - Generate auth URLs with CSRF state
 * - Exchange authorization codes for tokens
 * - Transparent token refresh
 */
export class GoogleAuthManager {
  private readonly client: OAuth2Client
  /** In-memory map of state token → Telegram user ID (pending auth flows). */
  private readonly pendingStates = new Map<string, number>()

  constructor(
    private readonly config: GoogleAuthConfig,
    private readonly tokenStore: IGoogleTokenStore,
  ) {
    this.client = new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri)

    // Persist refreshed tokens transparently
    this.client.on('tokens', (tokens) => {
      void this.saveToken(tokens).catch((cause) => {
        logger.error({ cause }, 'Failed to persist refreshed Google token')
      })
    })
  }

  /**
   * Attempts to load a previously saved OAuth2 token.
   * Returns true if a valid token was loaded, false otherwise.
   */
  async tryLoadToken(): Promise<boolean> {
    const result = await this.tokenStore.load()

    if (result.isErr()) {
      logger.error({ cause: result.error }, 'Failed to load Google token from store')
      return false
    }

    if (!result.value) {
      logger.info('No Google token in store — authentication required')
      return false
    }

    this.client.setCredentials(result.value)
    logger.info('Google OAuth2 token loaded from store')
    return true
  }

  /**
   * Generates an OAuth2 authorization URL.
   * Stores the state token mapped to the requesting Telegram user ID
   * so the callback can notify the right user.
   */
  generateAuthUrl(telegramUserId: number): string {
    const state = randomBytes(16).toString('hex')
    this.pendingStates.set(state, telegramUserId)

    // Clean up stale states after 10 minutes
    setTimeout(
      () => {
        this.pendingStates.delete(state)
      },
      10 * 60 * 1000,
    )

    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: [...GOOGLE_SCOPES],
      state,
      prompt: 'consent',
    })
  }

  /**
   * Exchanges an authorization code for tokens.
   * Returns the Telegram user ID that initiated the flow, or undefined
   * if the state token is unknown/expired.
   */
  async exchangeCode(code: string, state: string): Promise<number | undefined> {
    const telegramUserId = this.pendingStates.get(state)
    if (telegramUserId === undefined) {
      logger.warn({ state }, 'Unknown or expired OAuth2 state token')
      return undefined
    }
    this.pendingStates.delete(state)

    const { tokens } = await this.client.getToken(code)
    this.client.setCredentials(tokens)
    await this.saveToken(tokens)

    logger.info({ telegramUserId }, 'Google OAuth2 token acquired and saved')
    return telegramUserId
  }

  /** Returns the underlying OAuth2 client for use in API gateways. */
  getClient(): OAuth2Client {
    return this.client
  }

  /** Returns true if the client currently has credentials set. */
  isAuthenticated(): boolean {
    const creds = this.client.credentials
    return !!(creds.access_token ?? creds.refresh_token)
  }

  private async saveToken(tokens: Credentials): Promise<void> {
    const result = await this.tokenStore.save(tokens as Record<string, unknown>)
    if (result.isErr()) {
      logger.error({ cause: result.error }, 'Failed to save Google token to store')
      return
    }
    logger.info('Google OAuth2 token saved to store')
  }
}
