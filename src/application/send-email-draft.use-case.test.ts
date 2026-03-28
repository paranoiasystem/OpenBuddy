import { describe, it, expect, beforeEach } from 'vitest'

import { FakeEmailGateway } from '@shared/__tests__/helpers/fake-email-gateway.js'

import { SendEmailDraftUseCase } from './send-email-draft.use-case.js'

describe('SendEmailDraftUseCase', () => {
  let gateway: FakeEmailGateway
  let useCase: SendEmailDraftUseCase

  beforeEach(() => {
    gateway = new FakeEmailGateway()
    useCase = new SendEmailDraftUseCase(gateway)
  })

  it('should send an email draft', async () => {
    const draft = {
      to: ['test@example.com'],
      subject: 'Test',
      body: 'Hello',
    }

    const result = await useCase.execute(draft)

    expect(result.isOk()).toBe(true)
    expect(gateway.sentDrafts).toHaveLength(1)
    expect(gateway.sentDrafts[0]?.subject).toBe('Test')
  })

  it('should send with cc recipients', async () => {
    const draft = {
      to: ['test@example.com'],
      subject: 'Test',
      body: 'Hello',
      cc: ['cc@example.com'],
    }

    const result = await useCase.execute(draft)

    expect(result.isOk()).toBe(true)
    expect(gateway.sentDrafts[0]?.cc).toEqual(['cc@example.com'])
  })
})
