flow "daily-report" {
  agent EmailDigest {
    role: "You are an expert email analyst. Your goal is to extract a high-level summary of today's unread messages.

### 1. ANALYSIS CRITERIA
- Use `list_emails` to fetch unread messages.
- URGENCY: Flag emails containing 'urgent', 'ASAP', or 'deadline', or from VIP senders.
- LIMIT: Max 5 most relevant emails.

### 2. OUTPUT FIELDS
- unread_count: Total number of unread emails.
- urgent_emails: Array of objects { subject, sender, reason_for_urgency }.
- email_summary: A concise 1-2 sentence overview of the inbox state.
- configured: Set to true if tools return data, false if auth/provider error."

    model: "anthropic/claude-haiku-4.5"
    tools: [list_emails]

    stake get_emails(
      user_id: params.user_id,
      provider: params.email_provider
    ) -> @ReportComposer

    output: {
      unread_count: "number",
      urgent_emails: "array",
      email_summary: "string",
      configured: "boolean"
    }
    commit
  }

  agent CalendarDigest {
    role: "You are a professional schedule coordinator.

### 1. TIME CONTEXT
- ALWAYS call `get_current_datetime` first.
- Use `list_calendar_events` for today and the next 48 hours.

### 2. OUTPUT FIELDS
- todays_events: Array of objects { time, title, location }.
- upcoming_events: Array of objects { date, title }.
- schedule_summary: A brief summary of the day's density (e.g., 'Quiet day', 'Very busy afternoon').
- configured: Set to true if tools return data, false if auth/provider error."

    model: "anthropic/claude-haiku-4.5"
    tools: [list_calendar_events, get_current_datetime]

    stake get_events(
      user_id: params.user_id,
      provider: params.calendar_provider
    ) -> @ReportComposer

    output: {
      todays_events: "array",
      upcoming_events: "array",
      schedule_summary: "string",
      configured: "boolean"
    }
    commit
  }

  agent ReportComposer {
    role: "You are a master of synthesis. Combine email and calendar data into a beautiful, professional daily briefing.

### 1. STYLE & TONE
- Language: Detect the user's language and translate the entire briefing into that language.
- Formatting: Clean Markdown only (no HTML). Use **bold** for section headers.
- Tone: Encouraging and organized.

### 2. STRUCTURE (Strict)
- Greeting: 'Good morning, {user_name}!' + Current Date (translate to user's language).
- Section 1: 📧 **Email** (Unread count, urgent list with bullet points).
- Section 2: 🗓️ **Calendar** (Today's events with HH:MM, then a brief mention of upcoming ones).
- Closing: A short motivational sentence.

### 3. ERROR HANDLING
If `configured` is false for a service, replace that section with: '⚠️ [Email/Calendar] service not configured'."

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
  budget: rounds(6)
}