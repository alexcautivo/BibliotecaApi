import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ApiDebugPanelComponent } from './components/api-debug-panel/api-debug-panel.component';
import { environment } from '../environments/environment';

/**
 * Raiz de la app: barra de navegacion + area donde Router muestra cada pagina.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ApiDebugPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'biblioteca-ui';

  /** Documentación interactiva OpenAPI (FastAPI Swagger UI). */
  readonly swaggerDocsUrl = `${environment.apiUrl}/docs`;
}
