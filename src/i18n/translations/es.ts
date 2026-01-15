import type { TranslationStrings, PromptTranslations } from '../types';

export const strings: TranslationStrings = {
  // Header
  appTitle: 'YouTube Script',
  appSubtitle: 'Obtener texto → Enviar a AI',

  // Guide steps
  step1: 'Abrir video',
  step2: 'Elegir AI',
  step3: '¡Ir!',

  // Form labels
  aiLabel: 'AI',
  aiHint: 'Enviar a',
  analysisLabel: 'Análisis',
  analysisHint: 'Tipo',
  chooseAi: 'Elegir AI',
  chooseAnalysis: 'Tipo de Análisis',

  // Preset titles & descriptions
  summaryTitle: 'Resumen',
  summaryDesc: 'Puntos clave',
  businessTitle: 'Negocios',
  businessDesc: 'Estrategia',
  actionTitle: 'Plan de Acción',
  actionDesc: 'Pasos a seguir',
  learningTitle: 'Aprender',
  learningDesc: 'Ideas principales',

  // Buttons
  go: '¡Ir!',
  working: 'Trabajando...',
  customizePrompts: 'Editar Prompts',
  extractOnly: 'Solo Extraer',
  extractAgain: 'Extraer Otra Vez',
  save: 'Guardar',
  cancel: 'Cancelar',
  reset: 'Reset',
  resetAll: 'Reset Todo',

  // Dynamic
  quickSendTo: 'Envío Rápido a {provider}',
  readyPaste: '¡Listo! Pegar en {provider}',

  // Sidebar
  sidebarTitle: 'Transcripción YouTube',
  sidebarSubtitle: 'Extraer y enviar a AI',
  quickSendHint: 'Un clic: extraer + enviar',
  clickAiBelow: 'Clic en un AI',
  pasteInstruction: 'Copiamos el texto y abrimos AI. ¡Solo pegar!',
  transcriptPreview: 'Vista Previa',

  // Prompt Editor
  editPrompts: 'Editar Prompts',
  customized: 'Editado',

  // Errors
  errorNoTab: 'Sin pestaña',
  errorNotYouTube: 'Abrir un video de YouTube',
  errorSelectPrompt: 'Elegir un prompt',
  errorGeneric: 'Error',
  errorExtract: 'No se puede extraer',
  errorOpenAi: 'No se puede abrir AI',

  // Footer
  footerNote: 'Funciona con videos subtitulados',

  // Misc
  or: 'o',
};

export const prompts: PromptTranslations = {
  summary:
    'Resume este video en 5-7 puntos, enfocándote en las ideas principales y consejos prácticos.',
  business:
    'Extrae insights de negocios, tendencias del mercado y oportunidades estratégicas discutidas en este video.',
  actionPlan:
    'Crea un plan de acción con pasos concretos para implementar las ideas de este video.',
  learning:
    'Explica los conceptos clave, frameworks y mejores prácticas cubiertos en este video.',
};
