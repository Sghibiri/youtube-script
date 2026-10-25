import type { TranslationStrings, PromptTranslations } from '../types';

export const strings: TranslationStrings = {
  // Header
  appTitle: 'YouTube Script',

  // Form labels
  aiHint: 'Envoyer à',
  chatModeLabel: 'Discussion',
  chatTemporary: 'Temporaire',
  chatPermanent: 'Permanente',
  chatTemporaryHint: 'Pas gardée dans l’historique {provider}',
  chatPermanentHint: 'Gardée dans l’historique {provider}',
  chatTemporaryUnsupported: 'Temporaire non disponible pour {provider}',
  analysisLabel: 'Analyse',

  // Preset titles & descriptions
  keyMomentsTitle: 'Moments clés',
  keyMomentsDesc: 'Chronologie',
  summaryTitle: 'Résumé',
  summaryDesc: 'Points clés',
  validateTitle: 'Vérifier',
  validateDesc: 'Vérifier les faits',
  businessTitle: 'Business',
  businessDesc: 'Stratégie',
  actionTitle: "Plan d'Action",
  actionDesc: 'Étapes à faire',
  learningTitle: 'Apprendre',
  learningDesc: 'Idées principales',

  // Buttons
  working: 'En cours...',
  save: 'Sauver',
  cancel: 'Annuler',
  reset: 'Reset',
  resetAll: 'Tout Reset',

  // Dynamic
  sentAuto:
    "{provider} s'ouvre dans un nouvel onglet et envoie tout seul. Sinon, collez avec Ctrl+V / ⌘V.",

  // Sidebar
  sidebarTitle: 'Transcription YouTube',
  close: 'Fermer',
  languageLabel: 'Langue',
  sameAsVideo: 'Comme la vidéo',
  pasteHint:
    '{provider} s’ouvre avec le prompt copié. Collez-le avec Ctrl+V / ⌘V.',
  askPlaceholder: 'Une question sur cette vidéo…',
  ask: 'Demander',
  tabAnswer: 'Réponse',
  answerEmpty:
    'Choisissez une analyse ci-dessus. La réponse s’affiche ici, avec des horaires cliquables.',
  transcriptTitle: 'Transcription',
  searchPlaceholder: 'Rechercher dans la transcription',
  matchCount: '{count} résultats',
  noMatches: 'Aucun résultat',
  currentSpot: 'Maintenant',
  copyTranscript: 'Copier',
  loadingTranscript: 'Chargement de la transcription…',
  noCaptionsHint: "Cette vidéo n'a peut-être pas de sous-titres.",
  retry: 'Réessayer',
  jumpTo: 'Lire à partir de {time}',

  // AI answer
  answerWaiting: 'En attente de {provider}…',
  answerWriting: '{provider} écrit…',
  answerMoments: '{count} moments sur la barre de lecture',
  answerFailedComposer:
    'Impossible d’atteindre la zone de saisie de {provider}. Êtes-vous connecté ? Ouvrez la discussion et collez avec Ctrl+V / ⌘V.',
  answerFailedSend:
    'Le prompt n’est pas parti. Ouvrez la discussion et appuyez sur Entrée, ou collez avec Ctrl+V / ⌘V.',
  answerFailedNoReply:
    'Aucune réponse reçue. Ouvrez la discussion pour voir ce qui s’est passé.',
  answerCopied: 'Copié',
  openChat: 'Ouvrir la discussion',
  clearAnswer: 'Effacer la réponse',

  // Prompt Editor
  editPrompts: 'Modifier Prompts',
  customized: 'Modifié',

  // Errors
  openVideoHint:
    'Ouvrez une vidéo YouTube, puis cliquez sur cette icône pour voir sa transcription et l’analyser.',
  errorGeneric: 'Erreur',
  errorExtract: 'Impossible extraire',
  errorOpenAi: "Impossible ouvrir l'AI",
  errorReload: "L'extension a été mise à jour. Rechargez la page.",
  errorCopy: 'Copie impossible. Réessayez.',
  errorChatClosed: 'L’onglet de discussion a été fermé.',

  // Notes and the Library page
  saveNote: 'Ajouter à la Bibliothèque',
  noteSaved: 'Ajouté à la Bibliothèque',
  notePending:
    'Ouvrez la Bibliothèque et cliquez sur Autoriser l’accès pour l’écrire dans votre dossier.',
  noteNoFolder:
    'Choisissez un dossier dans la Bibliothèque pour le garder en fichier.',
  errorSaveNote:
    'Impossible d’enregistrer la note. Rechargez la page et réessayez.',
  openLibrary: 'Ouvrir la Bibliothèque',
  libraryTitle: 'Bibliothèque',
  noteCount: '{count} notes',
  folderReady: 'Enregistrement dans « {name} »',
  folderNone: 'Les notes ne sont pas encore enregistrées dans un dossier.',
  folderNeedsPermission:
    'Chrome demande à nouveau l’autorisation d’utiliser « {name} ».',
  folderMissing: '« {name} » a été déplacé ou supprimé.',
  folderUnsupported:
    'Ce navigateur ne peut pas enregistrer dans un dossier. Les notes restent dans l’extension.',
  chooseFolder: 'Choisir un dossier',
  changeFolder: 'Changer',
  allowFolder: 'Autoriser l’accès',
  notesPending: '{count} en attente d’écriture',
  syncImported: '{count} notes ajoutées depuis le dossier.',
  syncSkipped: '{count} fichiers de notes illisibles.',
  syncFailed: '{count} notes non écrites dans le dossier.',
  errorFolder: 'Impossible d’utiliser le dossier. Réessayez.',
  searchNotes: 'Rechercher dans les notes',
  notesEmpty:
    'Aucune note pour l’instant. Après une analyse, cliquez sur Enregistrer dans le panneau sur YouTube.',
  askLibraryPlaceholder: 'Interrogez vos notes…',
  askSends: 'Envoie {count} notes sur {total}',
  askTooLong: 'La note la plus récente est trop longue pour être envoyée.',
  deleteNote: 'Supprimer',
  deleteConfirm: 'Supprimer cette note et son fichier ?',
  errorDelete:
    'Suppression impossible. Autorisez l’accès au dossier, puis réessayez.',
  openAt: 'Ouvrir la vidéo à {time}',

  // Footer
};

export const prompts: PromptTranslations = {
  format:
    'Format de la réponse : commence par un résumé de la vidéo en 2-3 phrases, en paragraphe simple sans titre. Puis un titre court et la liste. 180 mots maximum au total : pas d’autres sections, pas de phrase de conclusion.',
  answerIn: 'Écris toute la réponse en {language}.',
  answerInVideo: 'Écris la réponse dans la même langue que la vidéo.',
  keyMoments:
    'Tâche : les moments clés de la vidéo dans l’ordre, 8 au maximum, une ligne chacun, au format « [m:ss] ce qui se passe ». Termine par une ligne : vaut-elle d’être regardée en entier ? Quelle partie regarder ?',
  validate:
    'Tâche : vérifier la solidité de la vidéo. Liste 5 affirmations ou idées principales au maximum, une ligne chacune : « [m:ss] l’affirmation. Verdict : Solide, Plausible, Douteuse ou Fausse, avec une courte raison. » Si tu peux chercher sur le web, utilise-le pour les faits clés. Sinon juge selon tes connaissances, écris « invérifiable » en cas de doute et n’invente jamais de sources. Signale le contexte manquant, les sponsors ou les conflits d’intérêts. Termine par une ligne : quel degré de confiance accorder à cette vidéo.',
  summary:
    'Tâche : les 5 points les plus importants de la vidéo, une ligne chacun, chacun commençant par son timestamp [m:ss].',
  business:
    'Tâche : 5 idées ou opportunités business de la vidéo au maximum, une ligne chacune, avec le timestamp [m:ss].',
  actionPlan:
    'Tâche : un plan d’action basé sur la vidéo, 5 étapes numérotées au maximum, une ligne chacune, avec le timestamp [m:ss] où la vidéo en parle.',
  learning:
    'Tâche : 5 idées clés que la vidéo enseigne au maximum, au format « Idée : explication en une ligne [m:ss] ».',
  question:
    'Réponds à cette question en utilisant uniquement la transcription de la vidéo : {question}\n\nCommence par une réponse directe en 1-2 phrases. Puis 3 points d’appui au maximum, une ligne chacun, avec les timestamps [m:ss]. Si la vidéo n’en parle pas, dis-le. 120 mots maximum.',
  library:
    'Réponds à cette question en utilisant uniquement mes notes ci-dessus : {question}\n\nCommence par une réponse directe en 1 à 3 phrases. Puis au plus 6 points à l’appui, une ligne chacun. Termine chaque point par sa source au format [N3 4:05] (numéro de note et temps), ou [N3] si aucun temps ne convient. Si les notes n’en parlent pas, dis-le. Moins de 200 mots.',
};
