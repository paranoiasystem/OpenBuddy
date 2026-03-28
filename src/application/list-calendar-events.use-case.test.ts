import { describe, it, expect, beforeEach } from 'vitest'

import { FakeCalendarGateway } from '@shared/__tests__/helpers/fake-calendar-gateway.js'

import { ListCalendarEventsUseCase } from './list-calendar-events.use-case.js'

describe('ListCalendarEventsUseCase', () => {
  let gateway: FakeCalendarGateway
  let useCase: ListCalendarEventsUseCase

  beforeEach(() => {
    gateway = new FakeCalendarGateway()
    useCase = new ListCalendarEventsUseCase(gateway)
  })

  it('should return events from the gateway', async () => {
    await gateway.createEvent({
      title: 'Event 1',
      startAt: new Date(),
      endAt: new Date(),
    })

    const result = await useCase.execute()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toHaveLength(1)
      expect(result.value[0]?.title).toBe('Event 1')
    }
  })

  it('should return empty list when no events exist', async () => {
    const result = await useCase.execute()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toHaveLength(0)
    }
  })

  it('should accept custom maxResults', async () => {
    const result = await useCase.execute(5)

    expect(result.isOk()).toBe(true)
  })
})
