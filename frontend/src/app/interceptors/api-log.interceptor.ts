import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

import { ApiLogService } from '../services/api-log.service';

function serializeBody(body: unknown): unknown {
  if (body === undefined || body === null) {
    return undefined;
  }
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}

export const apiLogInterceptor: HttpInterceptorFn = (req, next) => {
  const log = inject(ApiLogService);
  const t0 = performance.now();
  const requestBody = serializeBody(req.body);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          log.add({
            method: req.method,
            url: req.url,
            requestBody,
            statusCode: event.status,
            responseBody: event.body,
            durationMs: Math.round(performance.now() - t0),
            ok: event.ok,
          });
        }
      },
      error: (err: unknown) => {
        const httpErr = err instanceof HttpErrorResponse ? err : null;
        log.add({
          method: req.method,
          url: req.url,
          requestBody,
          statusCode: httpErr?.status,
          errorBody: httpErr?.error,
          durationMs: Math.round(performance.now() - t0),
          ok: false,
        });
      },
    }),
  );
};
