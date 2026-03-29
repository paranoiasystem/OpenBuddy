import { describe, it, expect, beforeEach } from 'vitest'

import { FakeCalendarGateway } from '@shared/__tests__/helpers/fake-calendar-gateway.js'

import { CreateCalendarEventUseCase } from './create-calendar-event.use-case.js'

describe('CreateCalendarEventUseCase', () => {
  let gateway: FakeCalendarGateway
  let useCase: CreateCalendarEventUseCase

  beforeEach(() => {
    gateway = new FakeCalendarGateway()
    useCase = new CreateCalendarEventUseCase(gateway)
  })

  it('should create an event and return it', async () => {
    const result = await useCase.execute({
      title: 'Dentist',
      startAt: new Date('2026-04-01T14:00:00Z'),
      endAt: new Date('2026-04-01T15:00:00Z'),
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.title).toBe('Dentist')
      expect(result.value.id).toBeDefined()
    }
  })

  it('should pass optional fields to the gateway', async () => {
    const result = await useCase.execute({
      title: 'Meeting',
      startAt: new Date('2026-04-01T10:00:00Z'),
      endAt: new Date('2026-04-01T11:00:00Z'),
      description: 'Team sync',
      location: 'Room A',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.description).toBe('Team sync')
      expect(result.value.location).toBe('Room A')
    }
  })
})
