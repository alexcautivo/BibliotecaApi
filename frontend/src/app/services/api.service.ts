import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Autor, Libro } from '../models/biblioteca.models';

/** Respuesta de GET /api/salud; capacidades solo existe en el backend actualizado. */
export interface SaludRespuesta {
  estado: string;
  mensaje: string;
  revision?: string;
  capacidades?: { delete_http: boolean; borrado_pasivo: boolean };
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly base = environment.apiUrl;
  private readonly http = inject(HttpClient);

  salud(): Observable<SaludRespuesta> {
    return this.http.get<SaludRespuesta>(`${this.base}/api/salud`);
  }

  listarAutores(incluirInactivos = false): Observable<Autor[]> {
    let params = new HttpParams();
    if (incluirInactivos) {
      params = params.set('incluir_inactivos', 'true');
    }
    return this.http.get<Autor[]>(`${this.base}/api/autores`, { params });
  }

  obtenerAutor(id: number, incluirInactivos = false): Observable<Autor> {
    let params = new HttpParams();
    if (incluirInactivos) {
      params = params.set('incluir_inactivos', 'true');
    }
    return this.http.get<Autor>(`${this.base}/api/autores/${id}`, { params });
  }

  crearAutor(body: Pick<Autor, 'nombre' | 'pais'>): Observable<Autor> {
    return this.http.post<Autor>(`${this.base}/api/autores`, body);
  }

  reemplazarAutor(id: number, body: Pick<Autor, 'nombre' | 'pais'>): Observable<Autor> {
    return this.http.put<Autor>(`${this.base}/api/autores/${id}`, body);
  }

  parchearAutor(id: number, body: Partial<Pick<Autor, 'nombre' | 'pais' | 'activo'>>): Observable<Autor> {
    return this.http.patch<Autor>(`${this.base}/api/autores/${id}`, body);
  }

  eliminarAutor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/autores/${id}`);
  }

  listarLibros(incluirInactivos = false): Observable<Libro[]> {
    let params = new HttpParams();
    if (incluirInactivos) {
      params = params.set('incluir_inactivos', 'true');
    }
    return this.http.get<Libro[]>(`${this.base}/api/libros`, { params });
  }

  obtenerLibro(id: number, incluirInactivos = false): Observable<Libro> {
    let params = new HttpParams();
    if (incluirInactivos) {
      params = params.set('incluir_inactivos', 'true');
    }
    return this.http.get<Libro>(`${this.base}/api/libros/${id}`, { params });
  }

  crearLibro(body: {
    titulo: string;
    anio_publicacion: number;
    precio: number;
    id_autor: number;
  }): Observable<Libro> {
    return this.http.post<Libro>(`${this.base}/api/libros`, body);
  }

  reemplazarLibro(
    id: number,
    body: { titulo: string; anio_publicacion: number; precio: number; id_autor: number },
  ): Observable<Libro> {
    return this.http.put<Libro>(`${this.base}/api/libros/${id}`, body);
  }

  parchearLibro(
    id: number,
    body: Partial<{ titulo: string; anio_publicacion: number; precio: number; id_autor: number; activo: boolean }>,
  ): Observable<Libro> {
    return this.http.patch<Libro>(`${this.base}/api/libros/${id}`, body);
  }

  eliminarLibro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/libros/${id}`);
  }
}
