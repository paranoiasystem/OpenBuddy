import { en } from './locales/en.js'
import { it } from './locales/it.js'
import type { Locale, MessageKeys } from './types.js'

const translations: Record<Locale, MessageKeys> = { it, en }

let currentLocale: Locale = 'it'

export function setLocale(locale: Locale): void {
  currentLocale = locale
}

export function getLocale(): Locale {
  return currentLocale
}

/** Returns the translated string for the given message key using the active locale. */
export function t(key: keyof MessageKeys): string {
  return translations[currentLocale][key]
}
