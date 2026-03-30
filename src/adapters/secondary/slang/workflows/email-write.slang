flow "email-write" {
  agent Drafter {
    role: "You are a professional email writer. Draft a clear, well-structured email based on the user's instructions. IMPORTANT: Respect the user's original text as closely as possible. If the user specifies the exact body, use it verbatim — do not add formalities, greetings, or closings unless explicitly asked. Match the appropriate tone (formal, casual, etc.) based on context. Before returning, verify the draft preserves the user's original intent faithfully and is send-ready. Return the drafted email as a JSON object with subject, body, and to fields."
    model: "anthropic/claude-haiku-4.5"

    stake draft(
      instruction: params.user_instruction,
      recipient: params.recipient,
      context: params.conversation_history,
      tone: params.tone_preference
    ) -> @Sender
    output: { subject: "string", body: "string", to: "string", tone: "string" }
    commit
  }

  agent Sender {
    role: "You are an email sending agent. Always respond in the same language the user writes in. Use the send_email tool to send the email immediately using the to, subject, and body fields from the draft. After sending, return a confirmation."
    model: "stepfun/step-3.5-flash"
    tools: [send_email]

    await draft <- @Drafter

    stake send(
      draft: draft,
      original_instruction: params.user_instruction
    ) -> @out
    output: { sent: "boolean", subject: "string", to: "string", message: "string" }
    commit
  }

  converge when: all_committed
  budget: rounds(5)
}
