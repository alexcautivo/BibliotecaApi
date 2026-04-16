import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from '../../services/api.service';
import { mensajeApiError } from '../../utils/api-error';

/**
 * Pantalla inicial: texto didactico + prueba GET /api/salud
 */
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mx-auto max-w-3xl space-y-6 p-6">
      <h1 class="text-2xl font-bold text-slate-800">Que es una API (en simple)</h1>
      <p class="text-slate-600">
        Una API es un <strong>contrato</strong> entre programas: el backend expone
        <strong>rutas</strong> (URLs) y metodos HTTP (GET, POST, PUT, PATCH). El front
        (Angular) envia peticiones y recibe JSON. La base guarda datos; la API es la
        capa que traduce HTTP a consultas SQL.
      </p>
      <ul class="list-inside list-disc space-y-2 text-slate-600">
        <li><strong>GET</strong>: leer datos (sin cambiar la base).</li>
        <li><strong>POST</strong>: crear un registro nuevo.</li>
        <li><strong>PUT</strong>: reemplazar un registro completo.</li>
        <li><strong>PATCH</strong>: cambiar solo algunos campos (incluye <code>activo: false</code> para delete pasivo).</li>
        <li><strong>DELETE</strong>: borrar definitivamente el registro en la base.</li>
      </ul>

      <section class="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
        <h2 class="text-lg font-semibold text-slate-800">Analogía: Restaurante</h2>
        <p class="mt-2 text-slate-600">
          Imagina que pides comida en un restaurante. <strong>Tú</strong> eres quien quiere
          algo (el usuario o la app en el navegador). El <strong>menú</strong> es como la
          documentación de la API: lista lo que puedes pedir y con qué nombre. El
          <strong>mesero</strong> es la <strong>API</strong>: recibe tu pedido en un
          lenguaje claro, lo lleva a quien prepara la comida y te trae el plato cuando está
          listo. La <strong>cocina</strong> es el <strong>backend</strong>: ahí se
          preparan los datos (consultas a la base, reglas de negocio); tú no entras a la
          cocina, solo hablas con el mesero. El <strong>plato</strong> que recibes es la
          <strong>respuesta</strong> (por ejemplo JSON): lo que pediste, empaquetado de
          forma entendible para el front.
        </p>
      </section>

      <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p class="text-sm font-medium text-slate-700">Prueba de conexion (GET /api/salud)</p>
        <p class="mt-2 font-mono text-sm text-emerald-700" *ngIf="mensaje">{{ mensaje }}</p>
        <p class="mt-2 text-sm text-amber-800" *ngIf="avisoVersion">{{ avisoVersion }}</p>
        <p class="mt-2 text-sm text-red-600" *ngIf="errorMsg">{{ errorMsg }}</p>
      </div>
    </div>
  `,
})
export class InicioComponent implements OnInit {
  private readonly api = inject(ApiService);

  /** Texto de exito al llamar GET /api/salud */
  mensaje = '';
  avisoVersion = '';
  /** Texto de error si el backend no responde */
  errorMsg = '';

  ngOnInit(): void {
    this.api.salud().subscribe({
      next: (r) => {
        this.mensaje = `${r.estado} — ${r.mensaje}` + (r.revision ? ` (${r.revision})` : '');
        this.errorMsg = '';
        if (!r.capacidades?.delete_http) {
          this.avisoVersion =
            'Este backend no declara DELETE ni borrado pasivo: probablemente es un proceso uvicorn antiguo. Reinicia el servidor desde la carpeta backend actual.';
        } else {
          this.avisoVersion = '';
        }
      },
      error: (err) => {
        this.errorMsg = mensajeApiError(err);
        this.mensaje = '';
      },
    });
  }
}
