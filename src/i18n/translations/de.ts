import type { TranslationStrings, PromptTranslations } from '../types';

export const strings: TranslationStrings = {
  // Header
  appTitle: 'YouTube Script',

  // Form labels
  aiHint: 'Senden an',
  chatModeLabel: 'Chat',
  chatTemporary: 'Temporär',
  chatPermanent: 'Dauerhaft',
  chatTemporaryHint: 'Nicht im {provider}-Verlauf gespeichert',
  chatPermanentHint: 'Im {provider}-Verlauf gespeichert',
  chatTemporaryUnsupported: 'Temporär für {provider} nicht verfügbar',
  analysisLabel: 'Analyse',

  // Preset titles & descriptions
  keyMomentsTitle: 'Schlüsselmomente',
  keyMomentsDesc: 'Zeitleiste',
  summaryTitle: 'Zusammenfassung',
  summaryDesc: 'Hauptpunkte',
  validateTitle: 'Prüfen',
  validateDesc: 'Fakten prüfen',
  businessTitle: 'Business',
  businessDesc: 'Strategie',
  actionTitle: 'Aktionsplan',
  actionDesc: 'Nächste Schritte',
  learningTitle: 'Lernen',
  learningDesc: 'Kernideen',

  // Buttons
  working: 'Läuft...',
  save: 'Speichern',
  cancel: 'Abbrechen',
  reset: 'Reset',
  resetAll: 'Alles Reset',

  // Dynamic
  sentAuto:
    '{provider} öffnet sich in einem neuen Tab und sendet automatisch. Falls nicht: mit Strg+V / ⌘V einfügen.',

  // Sidebar
  sidebarTitle: 'YouTube Transkript',
  close: 'Schließen',
  languageLabel: 'Sprache',
  sameAsVideo: 'Wie das Video',
  pasteHint:
    '{provider} öffnet sich mit kopiertem Prompt. Mit Strg+V / ⌘V einfügen.',
  askPlaceholder: 'Frage zu diesem Video…',
  ask: 'Fragen',
  tabAnswer: 'Antwort',
  answerEmpty:
    'Wähle oben eine Analyse. Die Antwort erscheint hier, mit klickbaren Zeiten.',
  transcriptTitle: 'Transkript',
  searchPlaceholder: 'Im Transkript suchen',
  matchCount: '{count} Treffer',
  noMatches: 'Keine Treffer',
  currentSpot: 'Jetzt',
  copyTranscript: 'Kopieren',
  loadingTranscript: 'Transkript wird geladen…',
  noCaptionsHint: 'Dieses Video hat vielleicht keine Untertitel.',
  retry: 'Erneut versuchen',
  jumpTo: 'Ab {time} abspielen',

  // AI answer
  answerWaiting: 'Warte auf {provider}…',
  answerWriting: '{provider} schreibt…',
  answerMoments: '{count} Momente auf der Zeitleiste',
  answerFailedComposer:
    'Das Eingabefeld von {provider} war nicht erreichbar. Bist du angemeldet? Öffne den Chat und füge mit Strg+V / ⌘V ein.',
  answerFailedSend:
    'Der Prompt wurde nicht gesendet. Öffne den Chat und drücke Enter, oder füge mit Strg+V / ⌘V ein.',
  answerFailedNoReply:
    'Keine Antwort erhalten. Öffne den Chat, um nachzusehen.',
  answerCopied: 'Kopiert',
  openChat: 'Chat öffnen',
  clearAnswer: 'Antwort löschen',

  // Prompt Editor
  editPrompts: 'Prompts Bearbeiten',
  customized: 'Bearbeitet',

  // Errors
  openVideoHint:
    'Öffne ein YouTube-Video und klicke dann auf dieses Symbol, um das Transkript zu sehen und es zu analysieren.',
  errorGeneric: 'Fehler',
  errorExtract: 'Kann nicht extrahieren',
  errorOpenAi: 'Kann AI nicht öffnen',
  errorReload: 'Die Erweiterung wurde aktualisiert. Seite neu laden.',
  errorCopy: 'Kopieren fehlgeschlagen. Erneut versuchen.',
  errorChatClosed: 'Der Chat-Tab wurde geschlossen.',

  // Notes and the Library page
  saveNote: 'In Bibliothek speichern',
  noteSaved: 'In Bibliothek gespeichert',
  notePending:
    'Öffne die Bibliothek und klicke auf Zugriff erlauben, um sie in deinen Ordner zu schreiben.',
  noteNoFolder:
    'Wähle in der Bibliothek einen Ordner, um sie als Datei zu behalten.',
  errorSaveNote:
    'Notiz konnte nicht gespeichert werden. Lade die Seite neu und versuche es noch einmal.',
  openLibrary: 'Bibliothek öffnen',
  libraryTitle: 'Bibliothek',
  noteCount: '{count} Notizen',
  folderReady: 'Speichert in „{name}“',
  folderNone: 'Notizen werden noch in keinem Ordner gespeichert.',
  folderNeedsPermission: 'Chrome braucht erneut deine Erlaubnis für „{name}“.',
  folderMissing: '„{name}“ wurde verschoben oder gelöscht.',
  folderUnsupported:
    'Dieser Browser kann nicht in einen Ordner speichern. Notizen bleiben in der Erweiterung.',
  chooseFolder: 'Ordner wählen',
  changeFolder: 'Ändern',
  allowFolder: 'Zugriff erlauben',
  notesPending: '{count} warten aufs Schreiben',
  syncImported: '{count} Notizen aus dem Ordner hinzugefügt.',
  syncSkipped: '{count} Notizdateien konnten nicht gelesen werden.',
  syncFailed: '{count} Notizen konnten nicht in den Ordner geschrieben werden.',
  errorFolder: 'Ordner konnte nicht verwendet werden. Versuche es noch einmal.',
  searchNotes: 'Notizen durchsuchen',
  notesEmpty:
    'Noch keine Notizen. Klicke nach einer Analyse in der Seitenleiste auf YouTube auf Speichern.',
  askLibraryPlaceholder: 'Frag deine Notizen…',
  askSends: 'Sendet {count} von {total} Notizen',
  askTooLong: 'Die neueste Notiz ist zu lang zum Senden.',
  deleteNote: 'Löschen',
  deleteConfirm: 'Diese Notiz und ihre Datei löschen?',
  errorDelete:
    'Löschen nicht möglich. Erlaube den Zugriff auf den Ordner und versuche es noch einmal.',
  openAt: 'Video bei {time} öffnen',

  // Footer
};

export const prompts: PromptTranslations = {
  format:
    'Antwortformat: Beginne mit einer Zusammenfassung des Videos in 2-3 Sätzen, als einfacher Absatz ohne Überschrift. Dann eine kurze Überschrift und die Liste. Insgesamt höchstens 180 Wörter: keine weiteren Abschnitte, kein Schlusswort.',
  answerIn: 'Schreibe die gesamte Antwort auf {language}.',
  answerInVideo: 'Schreibe die Antwort in derselben Sprache wie das Video.',
  keyMoments:
    'Aufgabe: die Schlüsselmomente des Videos der Reihe nach, höchstens 8, je eine Zeile im Format „[m:ss] was passiert“. Schließe mit einer Zeile: Lohnt sich das ganze Video? Welcher Teil?',
  validate:
    'Aufgabe: ein Realitätscheck des Videos. Liste höchstens 5 zentrale Behauptungen oder Ideen auf, je eine Zeile: „[m:ss] die Behauptung. Urteil: Solide, Plausibel, Zweifelhaft oder Falsch, mit kurzer Begründung.“ Wenn du im Web suchen kannst, nutze es für die wichtigsten Fakten. Sonst urteile nach deinem Wissen, schreibe „nicht überprüfbar“, wenn du unsicher bist, und erfinde nie Quellen. Weise auf fehlenden Kontext, Sponsoren oder Interessenkonflikte hin. Schließe mit einer Zeile: Wie sehr kann man diesem Video vertrauen?',
  summary:
    'Aufgabe: die 5 wichtigsten Punkte des Videos, je eine Zeile, jeweils mit dem Zeitstempel [m:ss] am Anfang.',
  business:
    'Aufgabe: höchstens 5 Business-Erkenntnisse oder Chancen aus dem Video, je eine Zeile, mit Zeitstempel [m:ss].',
  actionPlan:
    'Aufgabe: ein Aktionsplan auf Basis des Videos, höchstens 5 nummerierte Schritte, je eine Zeile, mit dem Zeitstempel [m:ss], wo das Video darüber spricht.',
  learning:
    'Aufgabe: höchstens 5 Kernideen, die das Video vermittelt, im Format „Idee: Erklärung in einer Zeile [m:ss]“.',
  question:
    'Beantworte diese Frage nur anhand des Video-Transkripts: {question}\n\nBeginne mit einer direkten Antwort in 1-2 Sätzen. Dann höchstens 3 stützende Punkte, je eine Zeile, mit Zeitstempeln [m:ss]. Wenn das Video das Thema nicht behandelt, sag es. Höchstens 120 Wörter.',
  library:
    'Beantworte diese Frage nur anhand meiner Notizen oben: {question}\n\nBeginne mit einer direkten Antwort in 1-3 Sätzen. Dann höchstens 6 stützende Punkte, je eine Zeile. Beende jeden Punkt mit seiner Quelle als [N3 4:05] (Notiznummer und Zeit) oder [N3], wenn keine Zeit passt. Wenn die Notizen es nicht abdecken, sag es. Unter 200 Wörtern.',
};
