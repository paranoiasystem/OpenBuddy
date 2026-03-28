flow "calendar" {
  agent CalendarAgent {
    role: "You are a calendar assistant. Use get_current_datetime first to know the current date and time. Then use list_calendar_events or create_calendar_event based on the user's request. Tool parameters: create_calendar_event requires title (descriptive string), start_at (ISO 8601), end_at (ISO 8601); optional: description, location. list_calendar_events accepts optional max_results (number). IMPORTANT: Call create_calendar_event exactly ONCE per request with ALL required parameters. Never call it without a specific title and explicit dates extracted from the user's message."
    model: "openai/gpt-4o-mini"
    tools: [list_calendar_events, create_calendar_event, get_current_datetime]

    stake manage(
      request: params.user_request,
      provider: params.calendar_provider,
      user_id: params.user_id,
      current_datetime: params.current_datetime
    ) -> @Formatter
    output: { action_taken: "string", events: "array", created_event: "object", message: "string" }
    commit
  }

  agent Formatter {
    role: "You are a calendar response formatter for Telegram. Format the calendar data as a friendly, readable message using plain text and minimal HTML (only <b> for bold). Show dates and times in a human-readable format. Use bullet points for event lists. Be concise."
    model: "openai/gpt-4o-mini"

    await calendar_data <- @CalendarAgent

    stake format(
      calendar_data: calendar_data,
      request: params.user_request
    ) -> @out
    output: { response: "string" }
    commit
  }

  converge when: all_committed
  budget: rounds(6)
}
