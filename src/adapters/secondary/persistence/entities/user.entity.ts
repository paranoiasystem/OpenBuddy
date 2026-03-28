import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  telegramId!: number

  @Column({ nullable: true })
  username?: string

  @Column()
  firstName!: string

  @CreateDateColumn()
  createdAt!: Date
}
