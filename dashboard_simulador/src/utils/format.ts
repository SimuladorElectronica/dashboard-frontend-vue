/**
 * Utilidades de formato compartidas por las vistas del dashboard.
 * Las fechas del backend llegan como ISO 8601 en UTC y se muestran en es-AR.
 */

/** `2026-11-05T10:00:00.000Z` → `05/11/2026` */
export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** `2026-11-09T12:00:00.000Z` → `09/11/2026, 09:00` */
export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
