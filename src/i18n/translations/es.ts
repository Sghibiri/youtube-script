import type { TranslationStrings, PromptTranslations } from '../types';

export const strings: TranslationStrings = {
  // Header
  appTitle: 'YouTube Script',

  // Form labels
  aiHint: 'Enviar a',
  chatModeLabel: 'Chat',
  chatTemporary: 'Temporal',
  chatPermanent: 'Permanente',
  chatTemporaryHint: 'No queda en tu historial de {provider}',
  chatPermanentHint: 'Queda en tu historial de {provider}',
  chatTemporaryUnsupported: 'Temporal no disponible para {provider}',
  analysisLabel: 'Análisis',

  // Preset titles & descriptions
  keyMomentsTitle: 'Momentos clave',
  keyMomentsDesc: 'Cronología',
  summaryTitle: 'Resumen',
  summaryDesc: 'Puntos clave',
  validateTitle: 'Verificar',
  validateDesc: 'Comprobar los hechos',
  businessTitle: 'Negocios',
  businessDesc: 'Estrategia',
  actionTitle: 'Plan de Acción',
  actionDesc: 'Pasos a seguir',
  learningTitle: 'Aprender',
  learningDesc: 'Ideas principales',

  // Buttons
  working: 'Trabajando...',
  save: 'Guardar',
  cancel: 'Cancelar',
  reset: 'Reset',
  resetAll: 'Reset Todo',

  // Dynamic
  sentAuto:
    '{provider} se abre en una pestaña nueva y lo envía solo. Si no, pega con Ctrl+V / ⌘V.',

  // Sidebar
  sidebarTitle: 'Transcripción YouTube',
  close: 'Cerrar',
  languageLabel: 'Idioma',
  sameAsVideo: 'Como el video',
  pasteHint:
    '{provider} se abre con el prompt copiado. Pégalo con Ctrl+V / ⌘V.',
  askPlaceholder: 'Pregunta sobre este video…',
  ask: 'Preguntar',
  tabAnswer: 'Respuesta',
  answerEmpty:
    'Elige un análisis arriba. La respuesta aparece aquí, con tiempos en los que puedes hacer clic.',
  transcriptTitle: 'Transcripción',
  searchPlaceholder: 'Buscar en la transcripción',
  matchCount: '{count} resultados',
  noMatches: 'Sin resultados',
  currentSpot: 'Ahora',
  copyTranscript: 'Copiar',
  loadingTranscript: 'Cargando transcripción…',
  noCaptionsHint: 'Puede que este video no tenga subtítulos.',
  retry: 'Reintentar',
  jumpTo: 'Reproducir desde {time}',

  // AI answer
  answerWaiting: 'Esperando a {provider}…',
  answerWriting: '{provider} está escribiendo…',
  answerMoments: '{count} momentos en la barra del video',
  answerFailedComposer:
    'No se pudo llegar al chat de {provider}. ¿Has iniciado sesión? Abre el chat y pega con Ctrl+V / ⌘V.',
  answerFailedSend:
    'El prompt no se envió. Abre el chat y pulsa Intro, o pega con Ctrl+V / ⌘V.',
  answerFailedNoReply:
    'No llegó ninguna respuesta. Abre el chat para ver qué pasó.',
  answerCopied: 'Copiado',
  openChat: 'Abrir chat',
  clearAnswer: 'Borrar respuesta',

  // Prompt Editor
  editPrompts: 'Editar Prompts',
  customized: 'Editado',

  // Errors
  openVideoHint:
    'Abre un video de YouTube y luego haz clic en este icono para ver su transcripción y analizarlo.',
  errorGeneric: 'Error',
  errorExtract: 'No se puede extraer',
  errorOpenAi: 'No se puede abrir AI',
  errorReload: 'La extensión se actualizó. Recarga la página.',
  errorCopy: 'No se pudo copiar. Inténtalo de nuevo.',
  errorChatClosed: 'La pestaña del chat se cerró.',

  // Notes and the Library page
  saveNote: 'Guardar en Biblioteca',
  noteSaved: 'Guardado en Biblioteca',
  notePending:
    'Abre la Biblioteca y pulsa Permitir acceso para escribirlo en tu carpeta.',
  noteNoFolder:
    'Elige una carpeta en la Biblioteca para conservarlo como archivo.',
  errorSaveNote:
    'No se pudo guardar la nota. Recarga la página e inténtalo de nuevo.',
  openLibrary: 'Abrir Biblioteca',
  libraryTitle: 'Biblioteca',
  noteCount: '{count} notas',
  folderReady: 'Guardando en «{name}»',
  folderNone: 'Las notas aún no se guardan en una carpeta.',
  folderNeedsPermission:
    'Chrome necesita tu permiso otra vez para usar «{name}».',
  folderMissing: '«{name}» se movió o se eliminó.',
  folderUnsupported:
    'Este navegador no puede guardar en una carpeta. Las notas se quedan en la extensión.',
  chooseFolder: 'Elegir carpeta',
  changeFolder: 'Cambiar',
  allowFolder: 'Permitir acceso',
  notesPending: '{count} esperando a escribirse',
  syncImported: 'Se añadieron {count} notas desde la carpeta.',
  syncSkipped: 'No se pudieron leer {count} archivos de notas.',
  syncFailed: 'No se pudieron escribir {count} notas en la carpeta.',
  errorFolder: 'No se pudo usar la carpeta. Inténtalo de nuevo.',
  searchNotes: 'Buscar en las notas',
  notesEmpty:
    'Aún no hay notas. Tras un análisis, pulsa Guardar en la barra lateral de YouTube.',
  askLibraryPlaceholder: 'Pregunta a tus notas…',
  askSends: 'Envía {count} de {total} notas',
  askTooLong: 'La nota más reciente es demasiado larga para enviarla.',
  deleteNote: 'Eliminar',
  deleteConfirm: '¿Eliminar esta nota y su archivo?',
  errorDelete:
    'No se pudo eliminar. Permite el acceso a la carpeta e inténtalo de nuevo.',
  openAt: 'Abrir el vídeo en {time}',

  // Footer
};

export const prompts: PromptTranslations = {
  format:
    'Formato de la respuesta: empieza con un resumen del video de 2-3 frases, como párrafo simple sin título. Luego un título corto y la lista. Máximo 180 palabras en total: sin otras secciones ni frases de cierre.',
  answerIn: 'Escribe toda la respuesta en {language}.',
  answerInVideo: 'Escribe la respuesta en el mismo idioma que el video.',
  keyMoments:
    'Tarea: los momentos clave del video en orden, máximo 8, una línea cada uno, con el formato "[m:ss] qué pasa". Termina con una línea: ¿vale la pena verlo entero? ¿Qué parte ver?',
  validate:
    'Tarea: un chequeo de realidad del video. Enumera como máximo 5 afirmaciones o ideas principales, una línea cada una: "[m:ss] la afirmación. Veredicto: Sólida, Plausible, Dudosa o Falsa, con una razón breve." Si puedes buscar en la web, úsala para los hechos clave. Si no, juzga según lo que sabes, escribe "no verificable" si no estás seguro y nunca inventes fuentes. Señala contexto que falte, patrocinadores o conflictos de interés. Termina con una línea: cuánto fiarse de este video.',
  summary:
    'Tarea: los 5 puntos más importantes del video, una línea cada uno, cada uno con su timestamp [m:ss] al principio.',
  business:
    'Tarea: máximo 5 ideas u oportunidades de negocio del video, una línea cada una, con el timestamp [m:ss].',
  actionPlan:
    'Tarea: un plan de acción basado en el video, máximo 5 pasos numerados, una línea cada uno, con el timestamp [m:ss] donde el video lo trata.',
  learning:
    'Tarea: máximo 5 ideas clave que enseña el video, con el formato "Idea: explicación en una línea [m:ss]".',
  question:
    'Responde a esta pregunta usando solo la transcripción del video: {question}\n\nEmpieza con una respuesta directa de 1-2 frases. Luego máximo 3 puntos de apoyo, una línea cada uno, con timestamps [m:ss]. Si el video no lo trata, dilo. Máximo 120 palabras.',
  library:
    'Responde a esta pregunta usando solo mis notas de arriba: {question}\n\nEmpieza con una respuesta directa en 1-3 frases. Luego como máximo 6 puntos de apoyo, una línea cada uno. Termina cada punto con su fuente como [N3 4:05] (número de nota y tiempo), o [N3] si ningún tiempo encaja. Si las notas no lo cubren, dilo. Menos de 200 palabras.',
};
