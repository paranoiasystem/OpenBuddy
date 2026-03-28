flow "triage" {
  agent Classifier {
    role: "You are an intent classifier for a personal AI assistant integrated with Telegram. Classify the user's message into exactly one of these intents: chat, email-read, email-write, calendar-read, calendar-write, daily-report, unknown. Extract any relevant parameters such as email addresses, dates, subjects, or search terms. Return a JSON object with the intent and extracted parameters."
    model: "openai/gpt-4o-mini"

    stake classify(
      message: params.user_message,
      context: params.user_context
    ) -> @out
    output: { intent: "string", confidence: "number", params: "object", requires_auth: "boolean", provider: "string" }
    commit
  }

  converge when: all_committed
}
