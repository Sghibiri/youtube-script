import type { TranslationStrings, PromptTranslations } from '../types';

export const strings: TranslationStrings = {
  // Header
  appTitle: 'YouTube Script',

  // Form labels
  aiHint: 'Invia a',
  chatModeLabel: 'Chat',
  chatTemporary: 'Temporanea',
  chatPermanent: 'Permanente',
  chatTemporaryHint: 'Non resta nella cronologia di {provider}',
  chatPermanentHint: 'Resta nella cronologia di {provider}',
  chatTemporaryUnsupported: 'Temporanea non supportata per {provider}',
  analysisLabel: 'Analisi',

  // Preset titles & descriptions
  keyMomentsTitle: 'Momenti chiave',
  keyMomentsDesc: 'Timeline',
  summaryTitle: 'Riassunto',
  summaryDesc: 'Punti chiave',
  validateTitle: 'Verifica',
  validateDesc: 'Controlla i fatti',
  businessTitle: 'Business',
  businessDesc: 'Strategia',
  actionTitle: 'Piano Azione',
  actionDesc: 'Cosa fare',
  learningTitle: 'Impara',
  learningDesc: 'Idee principali',

  // Buttons
  working: 'Lavoro...',
  save: 'Salva',
  cancel: 'Annulla',
  reset: 'Reset',
  resetAll: 'Reset Tutto',

  // Dynamic
  sentAuto:
    '{provider} si apre in una nuova scheda e invia da solo. Se non parte, incolla con Ctrl+V / ⌘V.',

  // Sidebar
  sidebarTitle: 'Trascrizione YouTube',
  close: 'Chiudi',
  languageLabel: 'Lingua',
  sameAsVideo: 'Come il video',
  pasteHint:
    '{provider} si apre con il prompt copiato. Incollalo con Ctrl+V / ⌘V.',
  askPlaceholder: 'Chiedi qualcosa sul video…',
  ask: 'Chiedi',
  tabAnswer: 'Risposta',
  answerEmpty:
    'Scegli un’analisi qui sopra. La risposta appare qui, con orari cliccabili.',
  transcriptTitle: 'Trascrizione',
  searchPlaceholder: 'Cerca nella trascrizione',
  matchCount: '{count} risultati',
  noMatches: 'Nessun risultato',
  currentSpot: 'Ora',
  copyTranscript: 'Copia',
  loadingTranscript: 'Carico la trascrizione…',
  noCaptionsHint: 'Forse questo video non ha sottotitoli.',
  retry: 'Riprova',
  jumpTo: 'Riproduci da {time}',

  // AI answer
  answerWaiting: 'In attesa di {provider}…',
  answerWriting: '{provider} sta scrivendo…',
  answerMoments: '{count} momenti sulla barra del video',
  answerFailedComposer:
    'Chat di {provider} non raggiungibile. Hai fatto il login? Apri la chat e incolla con Ctrl+V / ⌘V.',
  answerFailedSend:
    'Il prompt non è partito. Apri la chat e premi Invio, oppure incolla con Ctrl+V / ⌘V.',
  answerFailedNoReply:
    'Nessuna risposta ricevuta. Apri la chat per vedere cosa è successo.',
  answerCopied: 'Copiato',
  openChat: 'Apri chat',
  clearAnswer: 'Cancella risposta',

  // Prompt Editor
  editPrompts: 'Modifica Prompt',
  customized: 'Modificato',

  // Errors
  openVideoHint:
    'Apri un video YouTube, poi clicca questa icona per vedere la trascrizione e analizzarlo.',
  errorGeneric: 'Errore',
  errorExtract: 'Impossibile estrarre',
  errorOpenAi: 'Impossibile aprire AI',
  errorReload: "L'estensione è stata aggiornata. Ricarica la pagina.",
  errorCopy: 'Copia non riuscita. Riprova.',
  errorChatClosed: 'La scheda della chat è stata chiusa.',

  // Notes and the Library page
  saveNote: 'Salva in Libreria',
  noteSaved: 'Salvato in Libreria',
  notePending:
    'Apri la Libreria e clicca Consenti accesso per scriverlo nella cartella.',
  noteNoFolder: 'Scegli una cartella nella Libreria per tenerlo come file.',
  errorSaveNote: 'Impossibile salvare la nota. Ricarica la pagina e riprova.',
  openLibrary: 'Apri Libreria',
  libraryTitle: 'Libreria',
  noteCount: '{count} note',
  folderReady: 'Salvataggio in “{name}”',
  folderNone: 'Le note non vengono ancora salvate in una cartella.',
  folderNeedsPermission:
    'Chrome chiede di nuovo il permesso per usare “{name}”.',
  folderMissing: '“{name}” è stata spostata o eliminata.',
  folderUnsupported:
    'Questo browser non può salvare in una cartella. Le note restano nell’estensione.',
  chooseFolder: 'Scegli cartella',
  changeFolder: 'Cambia',
  allowFolder: 'Consenti accesso',
  notesPending: '{count} in attesa di essere scritte',
  syncImported: 'Aggiunte {count} note dalla cartella.',
  syncSkipped: '{count} file di note non leggibili.',
  syncFailed: '{count} note non scritte nella cartella.',
  errorFolder: 'Impossibile usare la cartella. Riprova.',
  searchNotes: 'Cerca nelle note',
  notesEmpty:
    'Ancora nessuna nota. Dopo un’analisi, clicca Salva nella barra laterale su YouTube.',
  askLibraryPlaceholder: 'Chiedi alle tue note…',
  askSends: 'Invia {count} di {total} note',
  askTooLong: 'La nota più recente è troppo lunga da inviare.',
  deleteNote: 'Elimina',
  deleteConfirm: 'Eliminare questa nota e il suo file?',
  errorDelete:
    'Impossibile eliminare. Consenti l’accesso alla cartella e riprova.',
  openAt: 'Apri il video a {time}',

  // Footer
};

export const prompts: PromptTranslations = {
  format:
    'Formato della risposta: inizia con un riassunto del video di 2-3 frasi, come paragrafo semplice senza titolo. Poi un titolo breve e l’elenco. Massimo 180 parole in tutto: niente altre sezioni, niente frasi di chiusura.',
  answerIn: 'Scrivi tutta la risposta in {language}.',
  answerInVideo: 'Scrivi la risposta nella stessa lingua del video.',
  keyMoments:
    'Compito: i momenti chiave del video in ordine, al massimo 8, una riga ciascuno, nel formato "[m:ss] cosa succede". Chiudi con una riga: vale la pena guardarlo tutto? Quale parte guardare?',
  validate:
    'Compito: un reality check del video. Elenca al massimo 5 affermazioni o idee principali, una riga ciascuna: "[m:ss] l’affermazione. Verdetto: Solida, Plausibile, Dubbia o Sbagliata, con un breve motivo." Se puoi cercare sul web, usalo per i fatti chiave. Altrimenti giudica in base a ciò che sai, scrivi "non verificabile" se non sei sicuro e non inventare fonti. Segnala contesto mancante, sponsor o conflitti di interesse. Chiudi con una riga: quanto fidarsi di questo video.',
  summary:
    'Compito: i 5 punti più importanti del video, una riga ciascuno, ognuno con il suo timestamp [m:ss] all’inizio.',
  business:
    'Compito: al massimo 5 spunti o opportunità di business dal video, una riga ciascuno, con il timestamp [m:ss].',
  actionPlan:
    'Compito: un piano d’azione basato sul video, al massimo 5 passi numerati, una riga ciascuno, con il timestamp [m:ss] del punto in cui il video ne parla.',
  learning:
    'Compito: al massimo 5 idee chiave che il video insegna, nel formato "Idea: spiegazione in una riga [m:ss]".',
  question:
    'Rispondi a questa domanda usando solo la trascrizione del video: {question}\n\nInizia con una risposta diretta di 1-2 frasi. Poi al massimo 3 punti a supporto, una riga ciascuno, con i timestamp [m:ss]. Se il video non ne parla, dillo. Massimo 120 parole.',
  library:
    'Rispondi a questa domanda usando solo le mie note qui sopra: {question}\n\nInizia con una risposta diretta di 1-3 frasi. Poi al massimo 6 punti a supporto, una riga ciascuno. Chiudi ogni punto con la sua fonte nel formato [N3 4:05] (numero della nota e tempo), oppure [N3] se nessun tempo è adatto. Se le note non ne parlano, dillo. Massimo 200 parole.',
};
