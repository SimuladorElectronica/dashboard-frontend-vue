/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del simulador React (donde vive la ruta /p/:shareSlug) */
  readonly VITE_SIMULATOR_URL?: string
}
