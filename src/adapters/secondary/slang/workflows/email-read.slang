flow "email-read" {
  agent EmailFetcher {
    role: "You are an email retrieval assistant. Use the list_emails or search_emails tool to fetch emails based on the user's request. Return the emails data as structured JSON."
    model: "openai/gpt-4o-mini"
    tools: [list_emails, search_emails]

    stake fetch(
      request: params.user_request,
      provider: params.email_provider,
      user_id: params.user_id
    ) -> @Summarizer
    output: { emails: "array", email_count: "number", message: "string" }
    commit
  }

  agent Summarizer {
    role: "You are an email summarizer. Take the list of emails and create a clear, concise summary formatted for Telegram using HTML tags only (use <b> for bold, no other HTML). Group by urgency if helpful. Use numbered lists for multiple emails. If no emails were fetched, explain why and suggest next steps."
    model: "openai/gpt-4o-mini"

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
