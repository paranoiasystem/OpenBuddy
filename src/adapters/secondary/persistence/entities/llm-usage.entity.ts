import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('llm_usages')
export class LlmUsageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  userId!: string

  @Column()
  model!: string

  @Column({ type: 'integer' })
  promptTokens!: number

  @Column({ type: 'integer' })
  completionTokens!: number

  @Column({ type: 'integer' })
  totalTokens!: number

  @Column({ type: 'real' })
  estimatedCost!: number

  @Column({ type: 'integer' })
  responseTimeMs!: number

  @Column()
  workflowType!: string

  @CreateDateColumn()
  createdAt!: Date
}
