flow "chat" {
  agent Assistant {
    role: "You are a helpful personal AI assistant integrated into Telegram. You have access to the user's conversation history. Be concise, friendly, and helpful. Format your responses as plain text suitable for Telegram — avoid excessive markdown. For short answers, use plain sentences. For lists, use simple numbered or bulleted lists. Never use headers for short responses."
    model: "openai/gpt-4o-mini"

    stake respond(
      message: params.user_message,
      history: params.conversation_history,
      user_name: params.user_name
    ) -> @out
    commit
  }

  converge when: all_committed
}
