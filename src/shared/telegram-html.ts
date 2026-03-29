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

  // Extract code blocks first and replace with placeholders to protect them
  const codeBlocks: string[] = []
  result = result.replace(/```(?:\w*)\n?([\s\S]*?)```/g, (_match, code: string) => {
    const idx = codeBlocks.length
    codeBlocks.push(`<pre>${escapeHtml(code.trim())}</pre>`)
    return `\x00CB${idx}\x00`
  })

  const inlineCodes: string[] = []
  result = result.replace(/`([^`\n]+)`/g, (_match, code: string) => {
    const idx = inlineCodes.length
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`)
    return `\x00IC${idx}\x00`
  })

  // Escape &, <, > in the remaining text BEFORE adding HTML tags
  result = escapeHtml(result)

  // Bold (**text** or __text__) → <b>
  result = result.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  result = result.replace(/__(.+?)__/g, '<b>$1</b>')

  // Italic (*text* or _text_) — avoid matching inside words or bold markers
  result = result.replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, '<i>$1</i>')
  result = result.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '<i>$1</i>')

  // Headings (# text) → <b>text</b>
  result = result.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>')

  // Blockquotes (&gt; text) → <blockquote>text</blockquote> (& is already escaped)
  result = result.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>')

  // Restore code blocks and inline codes
  for (let i = 0; i < codeBlocks.length; i++) {
    result = result.replace(`\x00CB${i}\x00`, codeBlocks[i] ?? '')
  }
  for (let i = 0; i < inlineCodes.length; i++) {
    result = result.replace(`\x00IC${i}\x00`, inlineCodes[i] ?? '')
  }

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
