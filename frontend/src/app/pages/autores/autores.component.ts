import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Autor } from '../../models/biblioteca.models';
import { ApiService } from '../../services/api.service';
import { mensajeApiError } from '../../utils/api-error';

@Component({
  selector: 'app-autores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mx-auto max-w-4xl space-y-8 p-6">
      <h2 class="text-xl font-semibold text-slate-800">Autores</h2>

      <div
        *ngIf="apiAdvertencia"
        class="rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      >
        {{ apiAdvertencia }}
      </div>
      <p *ngIf="msgAccion" class="text-sm text-emerald-800">{{ msgAccion }}</p>

      <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-medium text-slate-500">GET: listar</h3>
          <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" [(ngModel)]="incluirInactivos" (change)="refrescarLista()" name="incluirInactivos" />
            Incluir desactivados (delete pasivo)
          </label>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-slate-200 text-slate-500">
              <tr>
                <th class="py-2 pr-4">Id</th>
                <th class="py-2 pr-4">Nombre</th>
                <th class="py-2 pr-4">Pais</th>
                <th class="py-2 pr-4">Activo</th>
                <th class="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of autores" class="border-b border-slate-100" [class.bg-slate-50]="!a.activo">
                <td class="py-2 pr-4 font-mono">{{ a.id }}</td>
                <td class="py-2 pr-4">{{ a.nombre }}</td>
                <td class="py-2 pr-4">{{ a.pais }}</td>
                <td class="py-2 pr-4">{{ a.activo ? 'si' : 'no' }}</td>
                <td class="py-2">
                  <div class="flex flex-wrap gap-1">
                    <button
                      type="button"
                      *ngIf="a.activo"
                      class="rounded bg-amber-600 px-2 py-1 text-xs text-white hover:bg-amber-700"
                      (click)="desactivar(a.id)"
                    >
                      Desactivar
                    </button>
                    <button
                      type="button"
                      *ngIf="!a.activo"
                      class="rounded bg-amber-100 px-2 py-1 text-xs text-amber-900 hover:bg-amber-200"
                      (click)="reactivar(a.id)"
                    >
                      Reactivar
                    </button>
                    <button
                      type="button"
                      class="rounded bg-red-700 px-2 py-1 text-xs text-white hover:bg-red-800"
                      (click)="eliminarDuro(a.id)"
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
        <h3 class="mb-3 text-sm font-medium text-slate-500">POST: crear autor</h3>
        <div class="flex flex-wrap gap-3">
          <input
            class="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Nombre"
            [(ngModel)]="nuevoNombre"
            name="nuevoNombre"
          />
          <input
            class="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Pais"
            [(ngModel)]="nuevoPais"
            name="nuevoPais"
          />
          <button
            type="button"
            class="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            (click)="crear()"
          >
            Crear
          </button>
        </div>
        <p class="mt-2 text-sm text-emerald-700" *ngIf="okCrear">{{ okCrear }}</p>
        <p class="mt-2 text-sm text-red-600" *ngIf="errorCrear">{{ errorCrear }}</p>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="mb-3 text-sm font-medium text-slate-500">PUT: reemplazar por id (nombre y pais completos)</h3>
        <div class="flex flex-wrap gap-3">
          <input
            class="w-24 rounded border border-slate-300 px-3 py-2 text-sm"
            type="number"
            placeholder="Id"
            [(ngModel)]="putId"
            name="putId"
          />
          <input
            class="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Nombre"
            [(ngModel)]="putNombre"
            name="putNombre"
          />
          <input
            class="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Pais"
            [(ngModel)]="putPais"
            name="putPais"
          />
          <button
            type="button"
            class="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
            (click)="reemplazar()"
          >
            Reemplazar
          </button>
        </div>
        <p class="mt-2 text-sm text-emerald-700" *ngIf="okPut">{{ okPut }}</p>
        <p class="mt-2 text-sm text-red-600" *ngIf="errorPut">{{ errorPut }}</p>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="mb-3 text-sm font-medium text-slate-500">PATCH: solo cambiar pais</h3>
        <div class="flex flex-wrap gap-3">
          <input
            class="w-24 rounded border border-slate-300 px-3 py-2 text-sm"
            type="number"
            placeholder="Id"
            [(ngModel)]="patchId"
            name="patchId"
          />
          <input
            class="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Nuevo pais"
            [(ngModel)]="patchPais"
            name="patchPais"
          />
          <button
            type="button"
            class="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            (click)="parchear()"
          >
            Aplicar parche
          </button>
        </div>
        <p class="mt-2 text-sm text-emerald-700" *ngIf="okPatch">{{ okPatch }}</p>
        <p class="mt-2 text-sm text-red-600" *ngIf="errorPatch">{{ errorPatch }}</p>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="mb-3 text-sm font-medium text-slate-500">PATCH: delete pasivo por id (activo = false)</h3>
        <p class="mb-2 text-xs text-slate-500">Equivale a desactivar sin borrar la fila. Usa la lista o el id manual.</p>
        <div class="flex flex-wrap gap-3">
          <input
            class="w-24 rounded border border-slate-300 px-3 py-2 text-sm"
            type="number"
            placeholder="Id"
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
        <p class="mb-2 text-xs text-slate-500">Solo si no hay libros asociados (clave foranea).</p>
        <div class="flex flex-wrap gap-3">
          <input
            class="w-24 rounded border border-slate-300 px-3 py-2 text-sm"
            type="number"
            placeholder="Id"
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
export class AutoresComponent implements OnInit {
  private readonly api = inject(ApiService);

  /** Aviso si el proceso uvicorn no es el codigo nuevo (sin DELETE / sin columna activo). */
  apiAdvertencia = '';
  msgAccion = '';

  autores: Autor[] = [];
  incluirInactivos = false;
  errorLista = '';

  nuevoNombre = '';
  nuevoPais = '';
  okCrear = '';
  errorCrear = '';

  putId: number | null = null;
  putNombre = '';
  putPais = '';
  okPut = '';
  errorPut = '';

  patchId: number | null = null;
  patchPais = '';
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
            'Cierra todas las ventanas de uvicorn, ejecuta run-dev.cmd o en la carpeta backend: ' +
            'python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000';
        } else {
          this.apiAdvertencia = '';
        }
      },
      error: () => {
        this.apiAdvertencia = 'No se pudo llamar a GET /api/salud. Comprueba que el backend este en marcha.';
      },
    });
    this.refrescarLista();
  }

  refrescarLista(): void {
    this.errorLista = '';
    this.api.listarAutores(this.incluirInactivos).subscribe({
      next: (rows) => {
        this.autores = rows;
      },
      error: (err) => {
        this.errorLista = mensajeApiError(err);
      },
    });
  }

  crear(): void {
    this.okCrear = '';
    this.errorCrear = '';
    const nombre = this.nuevoNombre.trim();
    const pais = this.nuevoPais.trim();
    if (!nombre || !pais) {
      this.errorCrear = 'Completa nombre y pais.';
      return;
    }
    this.api.crearAutor({ nombre, pais }).subscribe({
      next: (creado) => {
        this.okCrear = `Creado id ${creado.id}`;
        this.nuevoNombre = '';
        this.nuevoPais = '';
        this.refrescarLista();
      },
      error: (err) => {
        this.errorCrear = mensajeApiError(err);
      },
    });
  }

  reemplazar(): void {
    this.okPut = '';
    this.errorPut = '';
    if (this.putId == null || this.putId < 1) {
      this.errorPut = 'Id invalido.';
      return;
    }
    const nombre = this.putNombre.trim();
    const pais = this.putPais.trim();
    if (!nombre || !pais) {
      this.errorPut = 'Completa nombre y pais para PUT.';
      return;
    }
    this.api.reemplazarAutor(this.putId, { nombre, pais }).subscribe({
      next: () => {
        this.okPut = 'Reemplazo guardado.';
        this.refrescarLista();
      },
      error: (err) => {
        this.errorPut = mensajeApiError(err);
      },
    });
  }

  parchear(): void {
    this.okPatch = '';
    this.errorPatch = '';
    if (this.patchId == null || this.patchId < 1) {
      this.errorPatch = 'Id invalido.';
      return;
    }
    const pais = this.patchPais.trim();
    if (!pais) {
      this.errorPatch = 'Escribe un pais nuevo.';
      return;
    }
    this.api.parchearAutor(this.patchId, { pais }).subscribe({
      next: () => {
        this.okPatch = 'Parche aplicado.';
        this.refrescarLista();
      },
      error: (err) => {
        this.errorPatch = mensajeApiError(err);
      },
    });
  }

  desactivar(id: number): void {
    this.msgAccion = '';
    this.api.parchearAutor(id, { activo: false }).subscribe({
      next: () => {
        this.msgAccion = `Autor ${id} desactivado (delete pasivo).`;
        this.refrescarLista();
      },
      error: (err) => {
        this.msgAccion = `Error: ${mensajeApiError(err)}`;
      },
    });
  }

  reactivar(id: number): void {
    this.msgAccion = '';
    this.api.parchearAutor(id, { activo: true }).subscribe({
      next: () => {
        this.msgAccion = `Autor ${id} reactivado.`;
        this.refrescarLista();
      },
      error: (err) => {
        this.msgAccion = `Error: ${mensajeApiError(err)}`;
      },
    });
  }

  eliminarDuro(id: number): void {
    if (!confirm(`Eliminar definitivamente el autor id ${id}?`)) return;
    this.msgAccion = '';
    this.api.eliminarAutor(id).subscribe({
      next: () => {
        this.msgAccion = `Autor ${id} eliminado de la base de datos.`;
        this.refrescarLista();
      },
      error: (err) => {
        this.msgAccion = `Error: ${mensajeApiError(err)}`;
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
    this.api.parchearAutor(this.softId, { activo: false }).subscribe({
      next: () => {
        this.okSoft = 'Autor desactivado (delete pasivo).';
        this.refrescarLista();
      },
      error: (err) => {
        this.errorSoft = mensajeApiError(err);
      },
    });
  }

  eliminarManual(): void {
    this.okHard = '';
    this.errorHard = '';
    if (this.hardId == null || this.hardId < 1) {
      this.errorHard = 'Id invalido.';
      return;
    }
    if (!confirm(`Borrar definitivamente el autor id ${this.hardId}?`)) return;
    this.api.eliminarAutor(this.hardId).subscribe({
      next: () => {
        this.okHard = 'Eliminado de la base de datos.';
        this.refrescarLista();
      },
      error: (err) => {
        this.errorHard = mensajeApiError(err);
      },
    });
  }
}
