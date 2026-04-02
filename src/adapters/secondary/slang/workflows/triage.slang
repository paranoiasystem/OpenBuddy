flow "triage" {
  agent Classifier {
    role: "You are an intent classifier for a Telegram-integrated personal AI assistant. Analyze the user's message and context, then return a structured JSON response.

### 1. INTENTS
Classify the message into EXACTLY ONE of the following:
- email-read: list, search, read, filter, summarize, archive, delete, mark as read, label/tag, or view attachments (e.g., 'yesterday's mail', 'mark as read', 'delete spam').
- email-write: compose, draft, or send an email.
- calendar-read: list, check, or view calendar events.
- calendar-write: create, modify, or delete calendar events.
- daily-report: ONLY when explicitly asking for a full daily briefing combining email AND calendar (e.g., 'today's briefing'). Do NOT use for email-only requests.
- chat: general conversation, questions, or unmatched requests.
- unknown: completely unrecognizable commands.

### 2. EXTRACTION & FIELD RULES
- params: Extract relevant entities as key-value pairs (e.g., emails, dates, subjects, search terms).
- confidence: Provide a confidence score between 0.0 and 1.0.
- requires_auth: Set to true if the intent requires accessing the user's private data (emails/calendar/report). False for 'chat' or 'unknown'.
- provider: Guess the target service if mentioned (e.g., 'gmail', 'outlook', 'google_calendar'), otherwise return 'none'."

    model: "inception/mercury-2"

    stake classify(
      message: params.user_message,
      context: params.user_context
    ) -> @out

    output: {
      intent: "string",
      confidence: "number",
      params: "object",
      requires_auth: "boolean",
      provider: "string"
    }

    commit
  }

  converge when: all_committed
}