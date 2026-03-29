import { describe, it, expect, beforeEach } from 'vitest'

import { FakeCalendarGateway } from '@shared/__tests__/helpers/fake-calendar-gateway.js'

import { CalendarService } from './calendar.service.js'

describe('CalendarService', () => {
  let gateway: FakeCalendarGateway
  let service: CalendarService

  beforeEach(() => {
    gateway = new FakeCalendarGateway()
    service = new CalendarService(gateway)
  })

  describe('createEvent', () => {
    it('should create an event and return it', async () => {
      const input = {
        title: 'Meeting',
        startAt: new Date('2026-04-01T10:00:00Z'),
        endAt: new Date('2026-04-01T11:00:00Z'),
      }

      const result = await service.createEvent(input)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.title).toBe('Meeting')
        expect(result.value.id).toBeDefined()
      }
    })
  })

  describe('listUpcomingEvents', () => {
    it('should return events from the gateway', async () => {
      await gateway.createEvent({
        title: 'Event 1',
        startAt: new Date(),
        endAt: new Date(),
      })

      const result = await service.listUpcomingEvents()

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(1)
      }
    })

    it('should use default maxResults of 10', async () => {
      const result = await service.listUpcomingEvents()

      expect(result.isOk()).toBe(true)
    })

    it('should accept a custom maxResults', async () => {
      const result = await service.listUpcomingEvents(5)

      expect(result.isOk()).toBe(true)
    })
  })
})
