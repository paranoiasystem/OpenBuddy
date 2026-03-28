import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('scheduled_tasks')
export class ScheduledTaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  userId!: string

  @Column()
  cronExpression!: string

  @Column()
  description!: string

  @Column()
  prompt!: string

  @Column({ default: true })
  enabled!: boolean

  @CreateDateColumn()
  createdAt!: Date
}
