# Agent Response Formatting Guide

Reference document for SLANG workflow agent instructions. All responses are rendered in Telegram using HTML parse mode.

## Supported Telegram HTML Tags

`<b>`, `<i>`, `<code>`, `<pre>`, `<a>`, `<blockquote>`, `<s>`, `<u>`, `<tg-spoiler>`

## General Rules

- Use only supported Telegram HTML tags
- Keep responses scannable: use bullet points, numbered lists, clear section breaks
- Use empty lines between sections
- Be concise: no unnecessary headers for short responses
- Always respond in the same language the user writes in

## Email Report (email-read)

```
<b>X email</b> trovate, <b>Y non lette</b>

<b>1.</b> <b>Sender Name</b> — Subject
   One-line summary of content

<b>2.</b> <b>Sender Name</b> — Subject
   One-line summary of content

<b>Azioni richieste:</b>
- Action item from email X
```

## Daily Briefing (daily-report)

```
<b>Buongiorno {user_name}!</b>
{weekday} {date}

<b>Email</b>
{unread_count} non lette
- Urgent/important email summary (if any)
- Brief bullet points of notable emails

<b>Calendario</b>
- <b>HH:MM</b> — Event title
- <b>HH:MM</b> — Event title

{Motivational closing line}
```

## Calendar Response

For event lists:
```
<b>I tuoi prossimi eventi:</b>

- <b>HH:MM</b> — Event title
- <b>HH:MM</b> — Event title{, location if present}
```

For event creation confirmations:
```
<b>Evento creato</b>
- Titolo: Event title
- Data: Day Month Year
- Ora: HH:MM - HH:MM
```

## Chat

- Plain text, conversational tone
- Lists for multi-item responses
- No headers for short answers
- Code blocks with `<pre>` when sharing code
