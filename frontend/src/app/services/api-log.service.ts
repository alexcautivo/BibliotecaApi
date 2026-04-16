import { Injectable, signal } from '@angular/core';

export interface ApiCallLogEntry {
  id: string;
  at: string;
  method: string;
  url: string;
  requestBody?: unknown;
  statusCode?: number;
  responseBody?: unknown;
  errorBody?: unknown;
  durationMs?: number;
  ok: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ApiLogService {
  private readonly entries = signal<ApiCallLogEntry[]>([]);
  readonly logs = this.entries.asReadonly();

  add(entry: Omit<ApiCallLogEntry, 'id' | 'at'>): void {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const row: ApiCallLogEntry = { ...entry, id, at: new Date().toISOString() };
    this.entries.update((list) => [row, ...list].slice(0, 40));
  }
}
