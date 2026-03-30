flow "daily-report" {
  agent EmailDigest {
    role: "You are an email digest agent. Always respond in the same language the user writes in. Use the list_emails tool to get today's unread emails. Count them, identify urgent ones (keywords: urgent, ASAP, deadline, important, urgente, scadenza), and prepare a structured digest summary. If email is not configured, note that in your response."
    model: "anthropic/claude-haiku-4.5"
    tools: [list_emails]

    stake get_emails(
      user_id: params.user_id,
      provider: params.email_provider
    ) -> @ReportComposer
    output: { unread_count: "number", urgent_emails: "array", email_summary: "string", configured: "boolean" }
    commit
  }

  agent CalendarDigest {
    role: "You are a calendar digest agent. Always respond in the same language the user writes in. Use get_current_datetime to know the current date, then use list_calendar_events to get today's and the next two days' events. Prepare a structured schedule summary. Show times in the user's local timezone. If calendar is not configured, note that in your response."
    model: "anthropic/claude-haiku-4.5"
    tools: [list_calendar_events, get_current_datetime]

    stake get_events(
      user_id: params.user_id,
      provider: params.calendar_provider
    ) -> @ReportComposer
    output: { todays_events: "array", upcoming_events: "array", schedule_summary: "string", configured: "boolean" }
    commit
  }

  agent ReportComposer {
    role: "You are a daily briefing composer for a personal AI assistant. Always respond in the same language the user writes in. Format for Telegram using only <b> for bold.\n\nFollow this structure strictly:\n\n<b>Buongiorno {user_name}!</b>\n{weekday} {date}\n\n<b>Email</b>\n{unread_count} non lette\n- Brief bullet points of important/urgent emails (max 5)\n- Mention urgent emails first if any\n\n<b>Calendario</b>\n- <b>HH:MM</b> — Event title (for each event today)\n- If no events: 'Nessun evento in programma oggi'\n- Upcoming events (next 2 days) as bullet points\n\n{Short motivational closing line}\n\nKeep each section compact. Use dashes for bullet points. If a service is not configured, mention it briefly."
    model: "anthropic/claude-haiku-4.5"

    await email_data <- @EmailDigest
    await calendar_data <- @CalendarDigest

    stake compose(
      email_data: email_data,
      calendar_data: calendar_data,
      user_name: params.user_name,
      current_date: params.current_date
    ) -> @out
    output: { briefing: "string" }
    commit
  }

  converge when: all_committed
}
