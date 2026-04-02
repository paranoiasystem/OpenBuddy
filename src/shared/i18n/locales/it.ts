import type { MessageKeys } from '../types.js'

export const it: MessageKeys = {
  WELCOME: 'Ciao! Sono OpenBuddy, il tuo assistente personale. Come posso aiutarti?',
  UNAUTHORIZED: 'Non sei autorizzato ad usare questo bot.',
  ERROR_GENERIC: 'Si è verificato un errore. Riprova tra poco.',
  ERROR_LLM_UNAVAILABLE: 'Il servizio AI non è al momento disponibile. Riprova tra poco.',
  PROCESSING: '⏳ Sto elaborando la tua richiesta...',
  SCHEDULE_CREATED: '✅ Attività programmata creata con successo.',
  SCHEDULE_DELETED: '🗑️ Attività programmata eliminata.',
  SCHEDULE_NOT_FOUND: 'Attività programmata non trovata.',
  CALENDAR_EVENT_CREATED: '📅 Evento creato sul calendario.',
  CALENDAR_AUTH_REQUIRED: 'Devi prima autenticarti con Google. Usa /auth per avviare il processo.',
  AUTH_START:
    'Clicca il pulsante qui sotto per autorizzare OpenBuddy ad accedere a Google Calendar e Gmail.\n\n' +
    '⚠️ Il link scade tra <b>10 minuti</b>.',
  AUTH_SUCCESS:
    '✅ <b>Autenticazione completata!</b>\n\nOra puoi usare Google Calendar e Gmail. Prova con:\n' +
    '• "Quali sono i miei eventi di oggi?"\n• "Scrivi una mail a..."',
  AUTH_ALREADY_DONE:
    '✅ Sei già autenticato con Google, ma puoi ripetere il processo per rigenerare il token.',
  AUTH_NOT_CONFIGURED:
    "⚠️ Le credenziali Google non sono configurate su questo bot. Contatta l'amministratore.",
  HELP_TEXT:
    '<b>Comandi disponibili:</b>\n\n' +
    '/start — Avvia il bot e mostra il messaggio di benvenuto\n' +
    '/auth — Autentica il bot con Google (Calendar e Gmail)\n' +
    '/help — Mostra questo messaggio di aiuto\n\n' +
    '<b>Funzionalità:</b>\n' +
    "• Scrivi liberamente per chattare con l'AI\n" +
    '• Chiedi di gestire il tuo <b>Google Calendar</b> (eventi, appuntamenti)\n' +
    '• Chiedi di leggere o inviare <b>email Gmail</b>\n' +
    '• Chiedi di creare un <b>report giornaliero</b> con email e calendario\n',
  UNKNOWN_COMMAND: 'Comando non riconosciuto. Usa /help per vedere i comandi disponibili.',
  AUTH_REQUIRED_GOOGLE:
    'Per utilizzare questa funzionalità devi prima autenticarti con Google. Usa /auth per avviare il processo.',
  ERROR_CHAT_WORKFLOW: 'Mi dispiace, non sono riuscito a elaborare la risposta. Riprova tra poco.',
  ERROR_EMAIL_WRITE_WORKFLOW:
    'Mi dispiace, non sono riuscito a preparare la bozza. Riprova tra poco.',
  ERROR_EMAIL_SEND_FAILED: 'Non sono riuscito a inviare la mail. Riprova tra poco.',
  ERROR_GENERIC_WORKFLOW:
    'Mi dispiace, non sono riuscito a completare la richiesta. Riprova tra poco.',
  AUTH_CALLBACK_NOT_CONFIGURED: '⚠️ Le credenziali Google non sono configurate.',
  AUTH_CALLBACK_CANCELLED_TITLE: 'Autenticazione annullata',
  AUTH_CALLBACK_CANCELLED_BODY:
    "❌ Hai annullato l'autorizzazione. Torna su Telegram e riprova con /auth.",
  AUTH_CALLBACK_INVALID_TITLE: 'Richiesta non valida',
  AUTH_CALLBACK_INVALID_BODY: '❌ Parametri mancanti nella risposta di Google.',
  AUTH_CALLBACK_ERROR_TITLE: 'Errore',
  AUTH_CALLBACK_ERROR_BODY:
    "❌ Impossibile completare l'autenticazione. Riprova con /auth su Telegram.",
  AUTH_CALLBACK_EXPIRED_TITLE: 'Sessione scaduta',
  AUTH_CALLBACK_EXPIRED_BODY:
    '⚠️ La sessione di autenticazione è scaduta. Torna su Telegram e riprova con /auth.',
  AUTH_CALLBACK_SUCCESS_TITLE: 'Autenticazione completata ✅',
  AUTH_CALLBACK_SUCCESS_BODY:
    '✅ Google Calendar e Gmail sono ora collegati a OpenBuddy! Puoi chiudere questa finestra e tornare su Telegram.',
}
