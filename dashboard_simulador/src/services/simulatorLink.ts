/**
 * Armado de URLs del simulador React para los accesos rápidos del dashboard.
 *
 * "Nuevo proyecto": abre el simulador con la SESIÓN de la cuenta y un lienzo
 * en blanco → el primer guardado creará un proyecto NUEVO asociado al usuario.
 *
 * El simulador acepta el token en la ruta `/session/:token` (guarda la sesión
 * y redirige a `/`); el query `?new=1` fuerza el arranque en blanco
 * (olvidando cualquier proyecto recordado en ese navegador).
 */
export function simulatorBaseUrl(): string {
  return (import.meta.env.VITE_SIMULATOR_URL || 'http://localhost:5174').replace(/\/+$/, '')
}

export function simulatorNewProjectUrl(token: string | null): string {
  const base = simulatorBaseUrl()
  return token ? `${base}/session/${encodeURIComponent(token)}?new=1` : `${base}/new`
}

/**
 * URL de un circuito compartido en el simulador (`/p/:shareSlug`).
 * Es la ruta que usa el simulador para cargar un proyecto plantilla o una entrega.
 */
export function simulatorProjectUrl(shareSlug: string): string {
  return `${simulatorBaseUrl()}/p/${encodeURIComponent(shareSlug)}`
}

/**
 * URL pública de una plantilla para el modo invitado (`/plantillas/:slug`).
 * El simulador la abre SIN sesión y carga la plantilla como copia editable en
 * memoria (el original nunca se modifica). `slug` es el shareSlug del proyecto.
 */
export function simulatorTemplateUrl(slug: string): string {
  return `${simulatorBaseUrl()}/plantillas/${encodeURIComponent(slug)}`
}
