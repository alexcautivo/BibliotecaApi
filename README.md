# Biblioteca API + UI

Proyecto de ejemplo full stack: **API REST** con **FastAPI** y **PostgreSQL**, y **interfaz Angular** que consume los endpoints. Incluye operaciones CRUD, borrado **pasivo** (columna `activo`) y borrado **definitivo** (HTTP `DELETE`).

## Requisitos previos

| Herramienta | Uso |
|-------------|-----|
| **Python 3.11+** (recomendado) | Backend |
| **Node.js 20+** y **npm** | Frontend Angular |
| **PostgreSQL** | Base de datos |

## Estructura del repositorio

```
DanielCastro/
├── backend/          # API FastAPI (uvicorn)
├── frontend/         # Angular 19
├── database/         # Scripts SQL (tablas y datos)
└── README.md
```

## 1. Base de datos (PostgreSQL)

1. Crea una base de datos, por ejemplo `biblioteca_api`:

   ```sql
   CREATE DATABASE biblioteca_api;
   ```

2. Conéctate a esa base (DBeaver, pgAdmin o `psql`) y ejecuta **en este orden**:

   - `database/01_crear_tablas_y_datos_dummy.sql` — crea tablas `autores` y `libros`, columna `activo` (borrado pasivo) y datos de ejemplo.
   - Si prefieres solo repetir la carga literaria con el mismo esquema: `database/02_datos_literarios_curados.sql` (equivale a borrar y volver a crear tablas + datos; revisa el comentario al inicio del archivo).

3. Anota usuario, contraseña, host, puerto y nombre de la base para la cadena de conexión del backend.

## 2. Backend (FastAPI)

Desde la carpeta `backend`:

```bash
cd backend
python -m venv .venv
```

**Windows (cmd):**

```cmd
.venv\Scripts\activate
pip install -r requirements.txt
```

**Linux / macOS:**

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### Variables de entorno (opcional)

Crea un archivo `backend/.env` si no quieres usar la URL por defecto:

```env
DATABASE_URL=postgresql+psycopg://USUARIO:CONTRASEÑA@localhost:5432/biblioteca_api
```

Si no existe `.env`, se usa la cadena por defecto definida en `db.py` (ajusta usuario, contraseña y nombre de base según tu entorno).

### Arrancar el servidor

```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- API: `http://127.0.0.1:8000`
- Documentación interactiva (Swagger): `http://127.0.0.1:8000/docs`
- Comprobación rápida: `GET http://127.0.0.1:8000/api/salud`

Deja esta terminal abierta mientras desarrollas; `--reload` recarga el código al guardar cambios.

## 3. Frontend (Angular)

En **otra terminal**, desde la carpeta `frontend`:

```bash
cd frontend
npm install
npm start
```

Por defecto la aplicación se sirve en **http://localhost:4200/** y está configurada para llamar al backend en **http://127.0.0.1:8000** (`frontend/src/environments/environment.ts`). Si cambias el puerto del API, actualiza `apiUrl` ahí.

## Comprobar que todo encaja

1. PostgreSQL con tablas cargadas.
2. Backend en marcha en el puerto **8000**.
3. Frontend en marcha en el puerto **4200**.
4. Abre el navegador en `http://localhost:4200` y usa la sección de depuración de peticiones o la página **Inicio** para validar `GET /api/salud`.

## Build de producción (frontend)

```bash
cd frontend
npm run build
```

Los artefactos quedan en `frontend/dist/biblioteca-ui/` (configurable en `angular.json`).

## Notas

- **CORS**: el backend permite orígenes `http://localhost:4200` y `http://127.0.0.1:4200` (ver `backend/main.py`).
- **Borrado pasivo**: se modela con `activo = false` en `autores` y `libros`; el borrado real es `DELETE` en las rutas correspondientes de la API.
