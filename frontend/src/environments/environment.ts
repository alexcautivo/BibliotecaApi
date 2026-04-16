/**
 * URL base del backend FastAPI (mismo equipo, otro puerto).
 * Cambia el puerto si uvicorn usa otro.
 */
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000',
};
