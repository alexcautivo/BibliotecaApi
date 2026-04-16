import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { ApiCallLogEntry, ApiLogService } from '../../services/api-log.service';

@Component({
  selector: 'app-api-debug-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border-t border-slate-300 bg-slate-900 text-slate-100">
      <button
        type="button"
        class="flex w-full items-center justify-between px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-300 hover:bg-slate-800"
        (click)="open.set(!open())"
      >
        <span>Depuracion API (metodo, URL, payload, respuesta)</span>
        <span>{{ open() ? 'Ocultar' : 'Mostrar' }}</span>
      </button>
      <div *ngIf="open()" class="max-h-96 overflow-auto border-t border-slate-700 px-4 py-3 font-mono text-xs">
        <div *ngFor="let entry of logs(); trackBy: trackByLogId" class="mb-4 border-b border-slate-700 pb-4 last:mb-0 last:border-0">
          <div class="text-emerald-400">
            {{ entry.method }} · {{ entry.statusCode ?? '?' }} · {{ entry.ok ? 'OK' : 'ERROR' }} ·
            {{ entry.durationMs ?? '?' }} ms
          </div>
          <div class="mt-1 break-all text-slate-300">{{ entry.at }}</div>
          <div class="mt-1 break-all text-slate-200">{{ entry.url }}</div>
          <ng-container *ngIf="entry.requestBody !== undefined">
            <div class="mt-2 text-slate-500">Request body</div>
            <pre class="mt-0.5 whitespace-pre-wrap break-words text-slate-200">{{ entry.requestBody | json }}</pre>
          </ng-container>
          <ng-container *ngIf="entry.responseBody !== undefined">
            <div class="mt-2 text-slate-500">Response body</div>
            <pre class="mt-0.5 whitespace-pre-wrap break-words text-slate-200">{{ entry.responseBody | json }}</pre>
          </ng-container>
          <ng-container *ngIf="entry.errorBody !== undefined">
            <div class="mt-2 text-slate-500">Error body</div>
            <pre class="mt-0.5 whitespace-pre-wrap break-words text-amber-200">{{ entry.errorBody | json }}</pre>
          </ng-container>
        </div>
        <p *ngIf="logs().length === 0" class="text-slate-500">Aun no hay llamadas HTTP en esta sesion.</p>
      </div>
    </div>
  `,
})
export class ApiDebugPanelComponent {
  private readonly apiLog = inject(ApiLogService);
  readonly logs = this.apiLog.logs;
  readonly open = signal(true);

  readonly trackByLogId = (_: number, e: ApiCallLogEntry) => e.id;
}
