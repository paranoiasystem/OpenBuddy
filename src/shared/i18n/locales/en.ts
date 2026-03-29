import type { MessageKeys } from '../types.js'

export const en: MessageKeys = {
  WELCOME: "Hi! I'm OpenBuddy, your personal assistant. How can I help you?",
  UNAUTHORIZED: 'You are not authorized to use this bot.',
  ERROR_GENERIC: 'An error occurred. Please try again shortly.',
  ERROR_LLM_UNAVAILABLE: 'The AI service is currently unavailable. Please try again shortly.',
  PROCESSING: '⏳ Processing your request...',
  SCHEDULE_CREATED: '✅ Scheduled task created successfully.',
  SCHEDULE_DELETED: '🗑️ Scheduled task deleted.',
  SCHEDULE_NOT_FOUND: 'Scheduled task not found.',
  CALENDAR_EVENT_CREATED: '📅 Event created on the calendar.',
  CALENDAR_AUTH_REQUIRED:
    'You need to authenticate with Google first. Use /auth to start the process.',
  AUTH_START:
    'Click the button below to authorize OpenBuddy to access Google Calendar and Gmail.\n\n' +
    '⚠️ The link expires in <b>10 minutes</b>.',
  AUTH_SUCCESS:
    '✅ <b>Authentication complete!</b>\n\nYou can now use Google Calendar and Gmail. Try:\n' +
    '• "What are my events today?"\n• "Write an email to..."',
  AUTH_ALREADY_DONE:
    '✅ You are already authenticated with Google, but you can repeat the process to regenerate the token.',
  AUTH_NOT_CONFIGURED:
    '⚠�� Google credentials are not configured on this bot. Contact the administrator.',
  HELP_TEXT:
    '<b>Available commands:</b>\n\n' +
    '/start — Start the bot and show the welcome message\n' +
    '/auth — Authenticate the bot with Google (Calendar and Gmail)\n' +
    '/help — Show this help message\n\n' +
    '<b>Features:</b>\n' +
    '• Write freely to chat with the AI\n' +
    '• Ask to manage your <b>Google Calendar</b> (events, appointments)\n' +
    '• Ask to read or send <b>Gmail emails</b>\n' +
    '• Ask for a <b>daily report</b> combining email and calendar\n',
  UNKNOWN_COMMAND: 'Unknown command. Use /help to see available commands.',
  AUTH_REQUIRED_GOOGLE:
    'You need to authenticate with Google first to use this feature. Use /auth to start the process.',
  ERROR_CHAT_WORKFLOW: "I'm sorry, I couldn't process the response. Please try again shortly.",
  ERROR_EMAIL_WRITE_WORKFLOW: "I'm sorry, I couldn't prepare the draft. Please try again shortly.",
  ERROR_EMAIL_SEND_FAILED: "I couldn't send the email. Please try again shortly.",
  ERROR_GENERIC_WORKFLOW: "I'm sorry, I couldn't complete the request. Please try again shortly.",
}
