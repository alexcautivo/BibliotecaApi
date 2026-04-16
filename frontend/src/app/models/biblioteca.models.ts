/**
 * Tipos que reflejan JSON del backend (coinciden con schemas Pydantic).
 */

export interface Autor {
  id: number;
  nombre: string;
  pais: string;
  activo: boolean;
}

export interface Libro {
  id: number;
  titulo: string;
  anio_publicacion: number;
  precio: string;
  id_autor: number;
  activo: boolean;
}
