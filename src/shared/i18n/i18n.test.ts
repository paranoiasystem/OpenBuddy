import { describe, it, expect, beforeEach } from 'vitest'

import { t, setLocale, getLocale } from './i18n.js'
import { en } from './locales/en.js'
import { it as itLocale } from './locales/it.js'
import type { MessageKeys } from './types.js'

describe('i18n', () => {
  beforeEach(() => {
    setLocale('it')
  })

  it('should default to Italian locale', () => {
    expect(getLocale()).toBe('it')
  })

  it('should return Italian string when locale is it', () => {
    expect(t('WELCOME')).toBe(itLocale.WELCOME)
  })

  it('should return English string when locale is en', () => {
    setLocale('en')
    expect(t('WELCOME')).toBe(en.WELCOME)
  })

  it('should switch locale with setLocale', () => {
    setLocale('en')
    expect(getLocale()).toBe('en')
    expect(t('ERROR_GENERIC')).toBe(en.ERROR_GENERIC)

    setLocale('it')
    expect(getLocale()).toBe('it')
    expect(t('ERROR_GENERIC')).toBe(itLocale.ERROR_GENERIC)
  })

  it('should have all keys defined in Italian locale', () => {
    const keys = Object.keys(itLocale) as (keyof MessageKeys)[]
    for (const key of keys) {
      expect(itLocale[key]).toBeDefined()
      expect(itLocale[key].length).toBeGreaterThan(0)
    }
  })

  it('should have all keys defined in English locale', () => {
    const keys = Object.keys(en) as (keyof MessageKeys)[]
    for (const key of keys) {
      expect(en[key]).toBeDefined()
      expect(en[key].length).toBeGreaterThan(0)
    }
  })

  it('should have the same keys in both locales', () => {
    const itKeys = Object.keys(itLocale).sort()
    const enKeys = Object.keys(en).sort()
    expect(itKeys).toEqual(enKeys)
  })
})
