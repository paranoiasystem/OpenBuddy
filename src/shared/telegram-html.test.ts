import { describe, it, expect } from 'vitest'

import { formatForTelegramHtml } from './telegram-html.js'

describe('formatForTelegramHtml', () => {
  it('should convert **bold** to <b>bold</b>', () => {
    expect(formatForTelegramHtml('**hello**')).toBe('<b>hello</b>')
  })

  it('should convert __bold__ to <b>bold</b>', () => {
    expect(formatForTelegramHtml('__hello__')).toBe('<b>hello</b>')
  })

  it('should convert *italic* to <i>italic</i>', () => {
    expect(formatForTelegramHtml('*hello*')).toBe('<i>hello</i>')
  })

  it('should convert `code` to <code>code</code>', () => {
    const result = formatForTelegramHtml('use `npm install`')
    expect(result).toContain('<code>npm install</code>')
  })

  it('should convert triple-backtick code blocks to <pre>', () => {
    const input = '```\nconst x = 1\n```'
    const result = formatForTelegramHtml(input)
    expect(result).toContain('<pre>')
    expect(result).toContain('const x = 1')
  })

  it('should convert # heading to <b>heading</b>', () => {
    expect(formatForTelegramHtml('# Title')).toBe('<b>Title</b>')
  })

  it('should convert ## heading to <b>heading</b>', () => {
    expect(formatForTelegramHtml('## Subtitle')).toBe('<b>Subtitle</b>')
  })

  it('should convert > quote to <blockquote>', () => {
    expect(formatForTelegramHtml('> quoted text')).toBe('<blockquote>quoted text</blockquote>')
  })

  it('should pass through existing HTML tags unchanged', () => {
    const html = '<b>bold</b> and <i>italic</i>'
    expect(formatForTelegramHtml(html)).toBe(html)
  })

  it('should escape & < > in plain text', () => {
    const result = formatForTelegramHtml('a & b < c > d')
    expect(result).toContain('&amp;')
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
  })

  it('should handle plain text without markdown', () => {
    const result = formatForTelegramHtml('Hello world')
    expect(result).toContain('Hello world')
  })
})
