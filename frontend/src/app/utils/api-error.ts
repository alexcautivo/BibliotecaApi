import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrae un mensaje legible del cuerpo de error JSON del backend (FastAPI).
 */
export function mensajeApiError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object') {
      const o = body as Record<string, unknown>;
      const detail = o['detail'];
      if (typeof detail === 'string') {
        return detail;
      }
      if (Array.isArray(detail)) {
        return detail
          .map((d: unknown) =>
            typeof d === 'object' && d !== null && 'msg' in d
              ? String((d as { msg: unknown }).msg)
              : JSON.stringify(d),
          )
          .join('; ');
      }
      const fieldMessages = o['field_messages'];
      if (Array.isArray(fieldMessages)) {
        return (fieldMessages as string[]).join('; ');
      }
    }
    return err.message || `Error HTTP ${err.status ?? ''}`;
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Error desconocido';
}
