flow "email-write" {
  agent Drafter {
    role: "You are a professional email writer. Draft a clear, well-structured email based on the user's instructions. Match the appropriate tone (formal, casual, etc.) based on context. Return the drafted email as a JSON object with subject and body fields."
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
    role: "You are an email quality reviewer. Review the drafted email for tone, clarity, grammar, and completeness. If it looks good, approve it and return the final version. If improvements are needed, make them and return the improved version. Always return an approved result."
    model: "openai/gpt-4o-mini"

    await draft <- @Drafter

    stake review(
      draft: draft,
      original_instruction: params.user_instruction
    ) -> @out
    output: { approved: "boolean", subject: "string", body: "string", to: "string", feedback: "string", preview: "string" }
    commit
  }

  converge when: all_committed
  budget: rounds(6)
}
