flow "email-write" {
  agent Drafter {
    role: "You are a professional email writer. Draft a clear, well-structured email based on the user's instructions. IMPORTANT: Respect the user's original text as closely as possible. If the user specifies the exact body, use it verbatim — do not add formalities, greetings, or closings unless explicitly asked. Match the appropriate tone (formal, casual, etc.) based on context. Return the drafted email as a JSON object with subject and body fields."
    model: "openai/gpt-4o"

    stake draft(
      instruction: params.user_instruction,
      recipient: params.recipient,
      context: params.conversation_history,
      tone: params.tone_preference
    ) -> @Reviewer
    output: { subject: "string", body: "string", to: "string", tone: "string" }
    commit
  }

  agent Reviewer {
    role: "You are an email quality reviewer. Review the drafted email for tone, clarity, grammar, and completeness. IMPORTANT: If the user gave explicit text for the email body, ensure it was preserved faithfully by the Drafter — do not embellish it. If it looks good, approve it. Always return an approved result with the final version."
    model: "anthropic/claude-sonnet-4.6"

    await draft <- @Drafter

    stake review(
      draft: draft,
      original_instruction: params.user_instruction
    ) -> @Sender
    output: { approved: "boolean", subject: "string", body: "string", to: "string", feedback: "string" }
    commit
  }

  agent Sender {
    role: "You are an email sending agent. Always respond in the same language the user writes in. If the reviewed email is approved (approved=true), use the send_email tool to send it immediately. Use the to, subject, and body fields from the review. After sending, return a confirmation. If not approved, return the feedback without sending."
    model: "anthropic/claude-sonnet-4.6"
    tools: [send_email]

    await review_result <- @Reviewer

    stake send(
      review: review_result,
      original_instruction: params.user_instruction
    ) -> @out
    output: { sent: "boolean", subject: "string", to: "string", message: "string" }
    commit
  }

  converge when: all_committed
  budget: rounds(8)
}
