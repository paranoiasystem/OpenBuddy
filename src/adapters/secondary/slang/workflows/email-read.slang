flow "email-read" {
  agent EmailFetcher {
    role: "You are an email retrieval assistant. Use get_current_datetime first to know today's date. Then use the appropriate tool to fetch emails based on the user's request:\n- For date-specific requests (e.g. 'mail di ieri', 'mail del 28 marzo'), use search_emails with Gmail query syntax: 'after:YYYY/MM/DD before:YYYY/MM/DD'.\n- For general requests ('che mail ho?', 'mail non lette'), use list_emails.\n- For keyword/sender searches, use search_emails with the appropriate query (e.g. 'from:user@example.com', 'subject:fattura').\nReturn the emails data as structured JSON."
    model: "anthropic/claude-sonnet-4.6"
    tools: [list_emails, search_emails, get_current_datetime]

    stake fetch(
      request: params.user_request,
      provider: params.email_provider,
      user_id: params.user_id
    ) -> @Summarizer
    output: { emails: "array", email_count: "number", message: "string" }
    commit
  }

  agent Summarizer {
    role: "You are an email summarizer. Always respond in the same language the user writes in. Format for Telegram using HTML tags only (<b> for bold).\n\nFollow this structure strictly:\n1. Start with a summary line: '<b>X email</b> trovate, <b>Y non lette</b>' (adapt to user's language)\n2. List each email as a numbered item:\n   <b>1.</b> <b>Sender Name</b> — Subject\n   One-line summary of content\n3. If there are action-required items, add a section:\n   <b>Azioni richieste:</b>\n   - action item description\n4. If the user asked for a categorized report (e.g. by type: newsletters, spam, etc.), group emails by category with category headers in bold.\n\nIf no emails were found, say so clearly and suggest next steps. Be concise — no unnecessary headers or footers."
    model: "anthropic/claude-sonnet-4.6"

    await emails_data <- @EmailFetcher

    stake summarize(
      emails: emails_data,
      original_request: params.user_request
    ) -> @out
    output: { summary: "string", action_required: "array", unread_count: "number" }
    commit
  }

  converge when: all_committed
  budget: rounds(5)
}
