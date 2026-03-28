/**
 * Converts Markdown artifacts (from LLM responses) to Telegram-supported HTML
 * and escapes unsafe characters. Telegram supports a limited set of HTML tags:
 * b, strong, i, em, u, ins, s, strike, del, code, pre, a, blockquote, tg-spoiler.
 */

const TELEGRAM_ALLOWED_TAGS =
  /^\/?(b|strong|i|em|u|ins|s|strike|del|code|pre|a|blockquote|tg-spoiler)\b/

/** Converts a string (potentially containing Markdown) to Telegram-safe HTML. */
export function formatForTelegramHtml(text: string): string {
  // If the text already looks like intentional HTML (contains known tags), skip
  // Markdown conversion and only strip unsupported tags.
  if (/<\/?(b|i|u|s|code|pre|a|blockquote)\b/i.test(text)) {
    return stripUnsupportedHtmlTags(text)
  }

  let result = text

  // Code blocks (``` ... ```) → <pre>
  result = result.replace(/```(?:\w*)\n?([\s\S]*?)```/g, (_match, code: string) => {
    return `<pre>${escapeHtml(code.trim())}</pre>`
  })

  // Inline code (` ... `) → <code>
  result = result.replace(/`([^`\n]+)`/g, (_match, code: string) => {
    return `<code>${escapeHtml(code)}</code>`
  })

  // Bold (**text** or __text__) → <b>
  result = result.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  result = result.replace(/__(.+?)__/g, '<b>$1</b>')

  // Italic (*text* or _text_) — avoid matching inside words or bold markers
  result = result.replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, '<i>$1</i>')
  result = result.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '<i>$1</i>')

  // Headings (# text) → <b>text</b>
  result = result.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>')

  // Blockquotes (> text) → <blockquote>text</blockquote>
  result = result.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')

  // Escape remaining &, <, > that are NOT inside tags we just created
  result = escapeOutsideTags(result)

  return result.trim()
}

/** Escapes &, <, > for safe HTML rendering. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Removes HTML tags that Telegram does not support, preserving their content. */
function stripUnsupportedHtmlTags(html: string): string {
  return html.replace(/<\/?([^>\s]+)([^>]*)>/g, (match, tag: string) => {
    return TELEGRAM_ALLOWED_TAGS.test(tag) ? match : ''
  })
}

/**
 * Escapes &, <, > characters that appear outside of HTML tags.
 * Preserves tags like <b>, <i>, <code>, <pre>, <a href="...">, <blockquote>.
 */
function escapeOutsideTags(text: string): string {
  const parts = text.split(/(<\/?[^>]+>)/g)
  return parts
    .map((part, i) => {
      // Odd indices are tag matches — pass through
      if (i % 2 === 1) return part
      // Even indices are text — escape
      return part.replace(/&/g, '&amp;').replace(/(?<!&amp;|&lt;|&gt;)</g, (ch) => {
        if (ch === '<') return '&lt;'
        if (ch === '>') return '&gt;'
        return ch
      })
    })
    .join('')
}
