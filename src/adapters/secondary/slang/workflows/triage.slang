flow "triage" {
  agent Classifier {
    role: "You are an intent classifier for a personal AI assistant integrated with Telegram. Classify the user's message into exactly one of these intents: chat, email-read, email-write, calendar-read, calendar-write, daily-report, unknown. Extract any relevant parameters such as email addresses, dates, subjects, or search terms.\n\nDisambiguation rules:\n- email-read: any request to list, search, read, filter, summarize, archive, delete, mark as read, label/tag, or view attachments of emails — including requests like 'mail di ieri', 'mail ricevute il 28 marzo', 'report delle mail', 'che mail ho ricevuto', 'archivia quella mail', 'segna come letta', 'elimina la mail di spam'.\n- email-write: any request to compose, draft, or send an email.\n- daily-report: ONLY when the user explicitly asks for a full daily briefing combining email AND calendar (e.g. 'fammi il briefing di oggi', 'report giornaliero'). Do NOT use daily-report for email-only requests.\n- calendar-read: any request to list, check, or view calendar events.\n- calendar-write: any request to create, modify, or delete calendar events.\n- chat: general conversation, questions, or anything that does not match the above.\n\nReturn a JSON object with the intent and extracted parameters."
    model: "stepfun/step-3.5-flash"

    stake classify(
      message: params.user_message,
      context: params.user_context
    ) -> @out
    output: { intent: "string", confidence: "number", params: "object", requires_auth: "boolean", provider: "string" }
    commit
  }

  converge when: all_committed
}
