import { Routes } from '@angular/router';

import { AutoresComponent } from './pages/autores/autores.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { LibrosComponent } from './pages/libros/libros.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'autores', component: AutoresComponent },
  { path: 'libros', component: LibrosComponent },
  { path: '**', redirectTo: '' },
];
