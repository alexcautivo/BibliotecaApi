import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Autor, Libro } from '../../models/biblioteca.models';
import { ApiService } from '../../services/api.service';
import { mensajeApiError } from '../../utils/api-error';

@Component({
  selector: 'app-libros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mx-auto max-w-4xl space-y-8 p-6">
      <h2 class="text-xl font-semibold text-slate-800">Libros</h2>

      <div
        *ngIf="apiAdvertencia"
        class="rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      >
        {{ apiAdvertencia }}
      </div>
      <p *ngIf="msgAccion" class="text-sm text-emerald-800">{{ msgAccion }}</p>
      <div
        *ngIf="errorAccion"
        class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        role="alert"
      >
        {{ errorAccion }}
      </div>

      <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-medium text-slate-500">GET: listar libros</h3>
          <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" [(ngModel)]="incluirInactivos" (change)="cargarAutoresYLibros()" name="incluirInactivosLib" />
            Incluir desactivados (delete pasivo)
          </label>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-slate-200 text-slate-500">
              <tr>
                <th class="py-2 pr-4">Id</th>
                <th class="py-2 pr-4">Titulo</th>
                <th class="py-2 pr-4">Anio</th>
                <th class="py-2 pr-4">Precio</th>
                <th class="py-2 pr-4">Id autor</th>
                <th class="py-2 pr-4">Activo</th>
                <th class="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of libros" class="border-b border-slate-100" [class.bg-slate-50]="!l.activo">
                <td class="py-2 pr-4 font-mono">{{ l.id }}</td>
                <td class="py-2 pr-4">{{ l.titulo }}</td>
                <td class="py-2 pr-4">{{ l.anio_publicacion }}</td>
                <td class="py-2 pr-4">{{ l.precio }}</td>
                <td class="py-2 pr-4">{{ l.id_autor }}</td>
                <td class="py-2 pr-4">{{ l.activo ? 'si' : 'no' }}</td>
                <td class="py-2">
                  <div class="flex flex-wrap gap-1">
                    <button
                      type="button"
                      *ngIf="l.activo"
                      class="rounded bg-amber-600 px-2 py-1 text-xs text-white hover:bg-amber-700"
                      (click)="desactivar(l.id)"
                    >
                      Desactivar
                    </button>
                    <button
                      type="button"
                      *ngIf="!l.activo"
                      class="rounded bg-amber-100 px-2 py-1 text-xs text-amber-900 hover:bg-amber-200"
                      (click)="reactivar(l.id)"
                    >
                      Reactivar
                    </button>
                    <button
                      type="button"
                      class="rounded bg-red-700 px-2 py-1 text-xs text-white hover:bg-red-800"
                      (click)="eliminarDuro(l.id, l.activo)"
                    >
                      Eliminar (BD)
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-sm text-red-600" *ngIf="errorLista">{{ errorLista }}</p>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="mb-3 text-sm font-medium text-slate-500">POST: nuevo libro (elige id de autor existente y activo)</h3>
        <div class="grid gap-3 sm:grid-cols-2">
          <input
            class="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Titulo"
            [(ngModel)]="nuevoTitulo"
            name="nuevoTitulo"
          />
          <input
            class="rounded border border-slate-300 px-3 py-2 text-sm"
            type="number"
            placeholder="Anio publicacion"
            [(ngModel)]="nuevoAnio"
            name="nuevoAnio"
          />
          <input
            class="rounded border border-slate-300 px-3 py-2 text-sm"
            type="number"
            step="0.01"
            placeholder="Precio"
            [(ngModel)]="nuevoPrecio"
            name="nuevoPrecio"
          />
          <select
            class="rounded border border-slate-300 px-3 py-2 text-sm"
            [(ngModel)]="nuevoIdAutor"
            name="nuevoIdAutor"
          >
            <option [ngValue]="null">Selecciona autor</option>
            <option *ngFor="let a of autores" [ngValue]="a.id">{{ a.id }} — {{ a.nombre }}</option>
          </select>
        </div>
        <button
          type="button"
          class="mt-3 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          (click)="crear()"
        >
          Crear libro
        </button>
        <p class="mt-2 text-sm text-emerald-700" *ngIf="okCrear">{{ okCrear }}</p>
        <p class="mt-2 text-sm text-red-600" *ngIf="errorCrear">{{ errorCrear }}</p>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="mb-3 text-sm font-medium text-slate-500">PUT: reemplazar libro completo</h3>
        <div class="grid gap-3 sm:grid-cols-2">
          <input
            class="rounded border border-slate-300 px-3 py-2 text-sm"
            type="number"
            placeholder="Id libro"
            [(ngModel)]="putId"
            name="putId"
          />
          <input
            class="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Titulo"
            [(ngModel)]="putTitulo"
            name="putTitulo"
          />
          <input
            class="rounded border border-slate-300 px-3 py-2 text-sm"
            type="number"
            placeholder="Anio"
            [(ngModel)]="putAnio"
            name="putAnio"
          />
          <input
            class="rounded border border-slate-300 px-3 py-2 text-sm"
            type="number"
            step="0.01"
            placeholder="Precio"
            [(ngModel)]="putPrecio"
            name="putPrecio"
          />
          <select
            class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            [(ngModel)]="putIdAutor"
            name="putIdAutor"
          >
            <option [ngValue]="null">Autor</option>
            <option *ngFor="let a of autores" [ngValue]="a.id">{{ a.id }} — {{ a.nombre }}</option>
          </select>
        </div>
        <button
          type="button"
          class="mt-3 rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
          (click)="reemplazar()"
        >
          Reemplazar
        </button>
        <p class="mt-2 text-sm text-emerald-700" *ngIf="okPut">{{ okPut }}</p>
        <p class="mt-2 text-sm text-red-600" *ngIf="errorPut">{{ errorPut }}</p>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="mb-3 text-sm font-medium text-slate-500">PATCH: solo cambiar precio</h3>
        <div class="flex flex-wrap gap-3">
          <input
            class="w-28 rounded border border-slate-300 px-3 py-2 text-sm"
            type="number"
            placeholder="Id libro"
            [(ngModel)]="patchId"
            name="patchId"
          />
          <input
            class="rounded border border-slate-300 px-3 py-2 text-sm"
            type="number"
            step="0.01"
            placeholder="Nuevo precio"
            [(ngModel)]="patchPrecio"
            name="patchPrecio"
          />
          <button
            type="button"
            class="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            (click)="parchear()"
          >
            Parchear precio
          </button>
        </div>
        <p class="mt-2 text-sm text-emerald-700" *ngIf="okPatch">{{ okPatch }}</p>
        <p class="mt-2 text-sm text-red-600" *ngIf="errorPatch">{{ errorPatch }}</p>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="mb-3 text-sm font-medium text-slate-500">PATCH: delete pasivo por id (activo = false)</h3>
        <div class="flex flex-wrap gap-3">
          <input
            class="w-28 rounded border border-slate-300 px-3 py-2 text-sm"
            type="number"
            placeholder="Id libro"
            [(ngModel)]="softId"
            name="softId"
          />
          <button
            type="button"
            class="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            (click)="desactivarManual()"
          >
            Desactivar (PATCH)
          </button>
        </div>
        <p class="mt-2 text-sm text-emerald-700" *ngIf="okSoft">{{ okSoft }}</p>
        <p class="mt-2 text-sm text-red-600" *ngIf="errorSoft">{{ errorSoft }}</p>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="mb-3 text-sm font-medium text-slate-500">DELETE: borrado definitivo por id</h3>
        <div class="flex flex-wrap gap-3">
          <input
            class="w-28 rounded border border-slate-300 px-3 py-2 text-sm"
            type="number"
            placeholder="Id libro"
            [(ngModel)]="hardId"
            name="hardId"
          />
          <button
            type="button"
            class="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
            (click)="eliminarManual()"
          >
            DELETE (BD)
          </button>
        </div>
        <p class="mt-2 text-sm text-emerald-700" *ngIf="okHard">{{ okHard }}</p>
        <p class="mt-2 text-sm text-red-600" *ngIf="errorHard">{{ errorHard }}</p>
      </section>
    </div>
  `,
})
export class LibrosComponent implements OnInit {
  private readonly api = inject(ApiService);

  apiAdvertencia = '';
  msgAccion = '';
  /** Errores de acciones en fila (desactivar / reactivar / eliminar): visible en rojo. */
  errorAccion = '';

  libros: Libro[] = [];
  autores: Autor[] = [];
  incluirInactivos = false;
  errorLista = '';

  nuevoTitulo = '';
  nuevoAnio: number | null = null;
  nuevoPrecio: number | null = null;
  nuevoIdAutor: number | null = null;
  okCrear = '';
  errorCrear = '';

  putId: number | null = null;
  putTitulo = '';
  putAnio: number | null = null;
  putPrecio: number | null = null;
  putIdAutor: number | null = null;
  okPut = '';
  errorPut = '';

  patchId: number | null = null;
  patchPrecio: number | null = null;
  okPatch = '';
  errorPatch = '';

  softId: number | null = null;
  okSoft = '';
  errorSoft = '';

  hardId: number | null = null;
  okHard = '';
  errorHard = '';

  ngOnInit(): void {
    this.api.salud().subscribe({
      next: (r) => {
        if (!r.capacidades?.delete_http) {
          this.apiAdvertencia =
            'El backend en el puerto 8000 parece una version antigua (no expone DELETE ni borrado pasivo). ' +
            'Cierra uvicorn y vuelve a arrancar desde la carpeta backend con el main.py actual.';
        } else {
          this.apiAdvertencia = '';
        }
      },
      error: () => {
        this.apiAdvertencia = 'No se pudo llamar a GET /api/salud. Comprueba que el backend este en marcha.';
      },
    });
    this.cargarAutoresYLibros();
  }

  cargarAutoresYLibros(): void {
    this.errorLista = '';
    this.api.listarAutores().subscribe({
      next: (a) => {
        this.autores = a;
      },
      error: (err) => {
        this.errorLista = mensajeApiError(err);
      },
    });
    this.api.listarLibros(this.incluirInactivos).subscribe({
      next: (rows) => {
        this.libros = rows;
      },
      error: (err) => {
        this.errorLista = mensajeApiError(err);
      },
    });
  }

  crear(): void {
    this.okCrear = '';
    this.errorCrear = '';
    const titulo = this.nuevoTitulo.trim();
    if (!titulo || this.nuevoAnio == null || this.nuevoPrecio == null || this.nuevoIdAutor == null) {
      this.errorCrear = 'Completa todos los campos.';
      return;
    }
    this.api
      .crearLibro({
        titulo,
        anio_publicacion: this.nuevoAnio,
        precio: this.nuevoPrecio,
        id_autor: this.nuevoIdAutor,
      })
      .subscribe({
        next: (c) => {
          this.okCrear = `Creado id ${c.id}`;
          this.nuevoTitulo = '';
          this.nuevoAnio = null;
          this.nuevoPrecio = null;
          this.nuevoIdAutor = null;
          this.cargarAutoresYLibros();
        },
        error: (err) => {
          this.errorCrear = mensajeApiError(err);
        },
      });
  }

  reemplazar(): void {
    this.okPut = '';
    this.errorPut = '';
    if (
      this.putId == null ||
      this.putAnio == null ||
      this.putPrecio == null ||
      this.putIdAutor == null
    ) {
      this.errorPut = 'Completa id, titulo, anio, precio y autor.';
      return;
    }
    const titulo = this.putTitulo.trim();
    if (!titulo) {
      this.errorPut = 'Titulo obligatorio.';
      return;
    }
    this.api
      .reemplazarLibro(this.putId, {
        titulo,
        anio_publicacion: this.putAnio,
        precio: this.putPrecio,
        id_autor: this.putIdAutor,
      })
      .subscribe({
        next: () => {
          this.okPut = 'Libro reemplazado.';
          this.cargarAutoresYLibros();
        },
        error: (err) => {
          this.errorPut = mensajeApiError(err);
        },
      });
  }

  parchear(): void {
    this.okPatch = '';
    this.errorPatch = '';
    if (this.patchId == null || this.patchPrecio == null) {
      this.errorPatch = 'Id y precio requeridos.';
      return;
    }
    this.api.parchearLibro(this.patchId, { precio: this.patchPrecio }).subscribe({
      next: () => {
        this.okPatch = 'Precio actualizado.';
        this.cargarAutoresYLibros();
      },
      error: (err) => {
        this.errorPatch = mensajeApiError(err);
      },
    });
  }

  desactivar(id: number): void {
    this.msgAccion = '';
    this.errorAccion = '';
    this.api.parchearLibro(id, { activo: false }).subscribe({
      next: () => {
        this.msgAccion = `Libro ${id} desactivado (delete pasivo).`;
        this.cargarAutoresYLibros();
      },
      error: (err) => {
        this.errorAccion = mensajeApiError(err);
      },
    });
  }

  reactivar(id: number): void {
    this.msgAccion = '';
    this.errorAccion = '';
    this.api.parchearLibro(id, { activo: true }).subscribe({
      next: () => {
        this.msgAccion = `Libro ${id} reactivado.`;
        this.cargarAutoresYLibros();
      },
      error: (err) => {
        this.errorAccion = mensajeApiError(err);
      },
    });
  }

  eliminarDuro(id: number, activo: boolean): void {
    this.errorAccion = '';
    if (activo) {
      this.msgAccion = '';
      this.errorAccion =
        'No se puede eliminar el libro de la base de datos mientras sigue activo. ' +
        'Primero pulsa Desactivar (borrado pasivo); después podrás usar Eliminar (BD).';
      return;
    }
    if (!confirm(`Eliminar definitivamente el libro id ${id}?`)) return;
    this.msgAccion = '';
    this.api.eliminarLibro(id).subscribe({
      next: () => {
        this.msgAccion = `Libro ${id} eliminado de la base de datos.`;
        this.cargarAutoresYLibros();
      },
      error: (err) => {
        this.errorAccion = mensajeApiError(err);
      },
    });
  }

  desactivarManual(): void {
    this.okSoft = '';
    this.errorSoft = '';
    if (this.softId == null || this.softId < 1) {
      this.errorSoft = 'Id invalido.';
      return;
    }
    this.api.parchearLibro(this.softId, { activo: false }).subscribe({
      next: () => {
        this.okSoft = 'Libro desactivado (delete pasivo).';
        this.cargarAutoresYLibros();
      },
      error: (err) => {
        this.errorSoft = mensajeApiError(err);
      },
    });
  }

  eliminarManual(): void {
    this.okHard = '';
    this.errorHard = '';
    this.errorAccion = '';
    if (this.hardId == null || this.hardId < 1) {
      this.errorHard = 'Id invalido.';
      return;
    }
    if (!confirm(`Borrar definitivamente el libro id ${this.hardId}?`)) return;
    this.api.eliminarLibro(this.hardId).subscribe({
      next: () => {
        this.okHard = 'Eliminado de la base de datos.';
        this.cargarAutoresYLibros();
      },
      error: (err) => {
        this.errorHard = mensajeApiError(err);
      },
    });
  }
}
