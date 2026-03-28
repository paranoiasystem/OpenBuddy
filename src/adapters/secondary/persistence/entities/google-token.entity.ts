import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

/**
 * Stores a single Google OAuth2 token set.
 * Uses a fixed singleton key so only one row ever exists.
 */
@Entity('google_tokens')
export class GoogleTokenEntity {
  @PrimaryColumn({ type: 'varchar', default: 'default' })
  id!: string

  @Column({ type: 'text' })
  tokenJson!: string

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date
}
