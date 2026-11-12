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
  return (import.meta.env.VITE_SIMULATOR_URL || 'http://localhost:5173').replace(/\/+$/, '')
}

export function simulatorNewProjectUrl(token: string | null): string {
  const base = simulatorBaseUrl()
  return token
    ? `${base}/session/${encodeURIComponent(token)}?new=1`
    : `${base}/new`
}
