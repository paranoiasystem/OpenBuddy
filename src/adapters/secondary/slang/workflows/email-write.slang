flow "email-write" {
  agent Drafter {
    role: "You are a professional email drafting agent. Your task is to generate a send-ready email based on user instructions.

### 1. DRAFTING RULES
- Respect original text: If the user specifies the exact body, use it VERBATIM. Do NOT add formalities, greetings, or closings unless explicitly asked.
- Tone: Match the requested tone (formal, casual, etc.) based on context or user preference.
- Completeness: Verify the draft preserves the user's original intent faithfully.

### 2. OUTPUT FIELDS
Return a JSON object containing:
- subject: A concise and relevant subject line.
- body: The drafted email body.
- to: The recipient's email address (extract from instructions or use the provided recipient parameter).
- tone: The tone applied to the draft."

    model: "anthropic/claude-haiku-4.5"

    stake draft(
      instruction: params.user_instruction,
      recipient: params.recipient,
      context: params.conversation_history,
      tone: params.tone_preference
    ) -> @Sender

    output: {
      subject: "string",
      body: "string",
      to: "string",
      tone: "string"
    }
    commit
  }

  agent Sender {
    role: "You are an email dispatch agent.

### 1. EXECUTION
- Use the `send_email` tool to send the email immediately.
- Pass the `to`, `subject`, and `body` fields exactly as received from the draft.

### 2. OUTPUT FIELDS
After execution, return a JSON object containing:
- sent: true if the email was successfully sent, false otherwise.
- subject: The subject of the email that was sent.
- to: The recipient's email address.
- message: A user-facing confirmation or error message. IMPORTANT: Detect the user's language from their original instruction and write this message in that same language. Use Markdown formatting only (no HTML)."

    model: "stepfun/step-3.5-flash"
    tools: [send_email]

    await draft <- @Drafter

    stake send(
      draft: draft,
      original_instruction: params.user_instruction
    ) -> @out

    output: {
      sent: "boolean",
      subject: "string",
      to: "string",
      message: "string"
    }
    commit
  }

  converge when: all_committed
  budget: rounds(5)
}