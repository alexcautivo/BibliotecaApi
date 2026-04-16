# Biblioteca API + UI

Proyecto de ejemplo **full stack**: **API REST** con **FastAPI** y **PostgreSQL**, e **interfaz Angular** que consume los endpoints. Incluye operaciones CRUD, borrado **pasivo** (columna `activo`) y borrado **definitivo** (HTTP `DELETE`).

---

## Tabla de contenidos

1. [Requisitos previos](#requisitos-previos)  
2. [Estructura del repositorio](#estructura-del-repositorio)  
3. [Instalación de PostgreSQL](#instalación-de-postgresql)  
4. [Crear la base de datos y poblarla](#crear-la-base-de-datos-y-poblarla)  
5. [Ver y administrar la base con DBeaver](#ver-y-administrar-la-base-con-dbeaver)  
6. [Configurar la conexión en el código (backend)](#configurar-la-conexión-en-el-código-backend)  
7. [Backend (FastAPI)](#backend-fastapi)  
8. [Frontend (Angular)](#frontend-angular)  
9. [Comprobar que todo encaja](#comprobar-que-encaja-todo)  
10. [Build de producción (frontend)](#build-de-producción-frontend)  
11. [Notas](#notas)

---

## Requisitos previos

| Herramienta | Uso |
|-------------|-----|
| **Python 3.11+** (recomendado) | Backend |
| **Node.js 20+** y **npm** | Frontend Angular |
| **PostgreSQL 14+** (recomendado) | Base de datos |
| **DBeaver** (opcional) | Cliente gráfico para crear la base, ejecutar SQL y explorar tablas |

---

## Estructura del repositorio

```
DanielCastro/
├── backend/          # API FastAPI (uvicorn); aquí va el archivo .env
├── frontend/         # Angular 19
├── database/         # Scripts SQL (tablas y datos)
└── README.md
```

---

## Instalación de PostgreSQL

### Windows

1. Descarga el instalador desde la página oficial: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/) (instalador gráfico o EDB).
2. Durante el asistente:
   - Anota el **puerto** (por defecto **5432**).
   - Define y **guarda** la contraseña del usuario superusuario **`postgres`** (la usarás en DBeaver y en `DATABASE_URL`).
   - Puedes dejar las opciones por defecto del resto del asistente.
3. Al finalizar, el servicio **PostgreSQL** quedará en ejecución en segundo plano (puedes comprobarlo en *Servicios* de Windows).

### Linux (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl status postgresql
```

El usuario del sistema Linux suele ser `postgres`; para la contraseña de aplicación puedes crear un usuario dedicado o usar `sudo -u postgres psql` para administración inicial.

### macOS (Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16
```

---

## Crear la base de datos y poblarla

### 1. Crear la base vacía

Conéctate al servidor PostgreSQL (con `psql`, DBeaver o la herramienta *SQL Shell* que instala PostgreSQL en Windows) usando la base por defecto **`postgres`** y ejecuta:

```sql
CREATE DATABASE biblioteca_api;
```

Si el nombre ya existe, puedes usar otro nombre, pero entonces debes usar **el mismo nombre** en `DATABASE_URL` del backend (ver sección de configuración).

### 2. Ejecutar el script de tablas y datos

1. Conéctate **a la base `biblioteca_api`** (no a `postgres`).
2. Ejecuta **un solo** archivo completo según lo que necesites:
   - **`database/01_crear_tablas_y_datos_dummy.sql`** — Crea las tablas `autores` y `libros` (con columna `activo` para borrado pasivo) e inserta datos de ejemplo. **Es el archivo recomendado para la primera instalación.**
   - **`database/02_datos_literarios_curados.sql`** — Mismo esquema y mismos datos que el anterior; sirve como **alternativa equivalente** o para volver a cargar el mismo conjunto literario desde cero (el script hace `DROP` de las tablas y las vuelve a crear).

**Importante:** `01` y `02` son **equivalentes** para una instalación limpia; no hace falta ejecutar los dos seguidos la primera vez (ambos recrean tablas y datos). Usa **solo `01`** para empezar, salvo que prefieras explícitamente el archivo `02`.

### 3. Qué debes tener anotado para el backend

- **Host:** normalmente `localhost` o `127.0.0.1`
- **Puerto:** normalmente `5432`
- **Nombre de la base:** por ejemplo `biblioteca_api`
- **Usuario y contraseña:** el usuario de PostgreSQL con permiso sobre esa base (en instalaciones típicas de Windows, `postgres` y la contraseña que definiste en el instalador)

---

## Ver y administrar la base con DBeaver

[DBeaver](https://dbeaver.io/) es un cliente universal gratuito; para este proyecto basta la edición **Community**.

### Instalación

1. Descarga DBeaver Community desde [https://dbeaver.io/download/](https://dbeaver.io/download/).
2. Instálalo con el asistente habitual.

### Crear una conexión a PostgreSQL

1. Abre DBeaver.
2. Clic en **Nueva conexión** (icono del enchufe) o menú **Base de datos → Nueva conexión de base de datos**.
3. Elige **PostgreSQL** → **Siguiente**.
4. En la pestaña **Principal**:
   - **Host:** `localhost`
   - **Puerto:** `5432` (o el que configuraste)
   - **Base de datos:** primero puedes usar `postgres` para crear `biblioteca_api`; después crea otra conexión o cambia este campo a **`biblioteca_api`** para trabajar en tu base del proyecto.
   - **Usuario:** por ejemplo `postgres`
   - **Contraseña:** la del usuario
5. Opcional: marca **Guardar contraseña** solo en equipos personales.
6. Pulsa **Probar conexión…**. Si falta el controlador, DBeaver ofrecerá descargarlo; acepta.
7. **Finalizar**. En el panel izquierdo verás el servidor y, al expandir, las bases y tablas.

### Crear la base desde DBeaver (si aún no existe)

1. Conéctate a la base `postgres`.
2. Clic derecho en **Bases de datos → Crear nueva base de datos**.
3. Nombre: `biblioteca_api` → **Aceptar**.
4. Conéctate a `biblioteca_api` (nueva conexión o edita la existente y cambia el nombre de la base).

### Ejecutar los scripts SQL y ver los datos

1. Conéctate a **`biblioteca_api`**.
2. Menú **SQL Editor → Abrir script SQL** y elige `database/01_crear_tablas_y_datos_dummy.sql`, o pega su contenido en un editor SQL nuevo.
3. Ejecuta el script completo (por ejemplo **Ctrl+Enter** o el botón de ejecutar todo el script, según la versión).
4. En el árbol de objetos: **biblioteca_api → Esquemas → public → Tablas** verás `autores` y `libros`. Clic derecho en una tabla → **Ver datos** para inspeccionar filas.

---

## Configurar la conexión en el código (backend)

El backend **no** guarda usuario y contraseña en el código fuente de la aplicación: usa la variable de entorno **`DATABASE_URL`**.

### Archivo principal: `backend/.env`

1. En la carpeta `backend`, copia el ejemplo:

   ```text
   Copia backend/.env.example y renómbralo a backend/.env
   ```

2. Edita **`backend/.env`** y ajusta la URL con **tus** datos:

   ```env
   DATABASE_URL=postgresql+psycopg://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BASE
   ```

   Ejemplo local típico:

   ```env
   DATABASE_URL=postgresql+psycopg://postgres:mi_clave@localhost:5432/biblioteca_api
   ```

   - **`USUARIO`**: usuario de PostgreSQL (ej. `postgres`).
   - **`CONTRASEÑA`**: si contiene caracteres especiales (`@`, `#`, `:`, etc.), conviene codificarlos en formato URL o usar una contraseña sin esos caracteres para evitar errores de parseo.
   - **`HOST`**: `localhost` o `127.0.0.1` en local.
   - **`PUERTO`**: normalmente `5432`.
   - **`NOMBRE_BASE`**: debe coincidir con la base donde ejecutaste los scripts, p. ej. `biblioteca_api`.

El cargador de variables (`python-dotenv`) se invoca en **`backend/db.py`**, que es el único sitio donde se lee `DATABASE_URL` para crear el motor de SQLAlchemy.

### Si no usas `.env`: valor por defecto en `backend/db.py`

Si **no** creas `backend/.env`, la aplicación usa la cadena definida en la variable **`_DEFAULT_URL`** dentro de **`backend/db.py`**. Por defecto apunta a:

`postgresql+psycopg://postgres:postgres@localhost:5432/postgres`

Es decir: usuario `postgres`, contraseña `postgres`, base **`postgres`**. Para un entorno limpio lo habitual es:

- Crear la base **`biblioteca_api`**, y  
- Definir **`DATABASE_URL` en `backend/.env`** apuntando a `biblioteca_api` con tu usuario y contraseña reales.

Así no necesitas editar `db.py` salvo que quieras cambiar el valor por defecto de desarrollo para todo el equipo.

### Resumen rápido

| Qué quieres cambiar | Dónde |
|---------------------|--------|
| Usuario, contraseña, host, puerto o nombre de la base | **`backend/.env`** → variable **`DATABASE_URL`** |
| Comportamiento por defecto sin archivo `.env` | **`backend/db.py`** → **`_DEFAULT_URL`** (opcional; se recomienda usar `.env`) |

La URL debe usar el esquema que espera SQLAlchemy con **psycopg** v3: **`postgresql+psycopg://`** (como en `.env.example`).

---

## Backend (FastAPI)

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

### Arrancar el servidor

```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- API: `http://127.0.0.1:8000`
- Documentación interactiva (Swagger): `http://127.0.0.1:8000/docs`
- Comprobación rápida: `GET http://127.0.0.1:8000/api/salud`

Deja esta terminal abierta mientras desarrollas; `--reload` recarga el código al guardar cambios.

---

## Frontend (Angular)

En **otra terminal**, desde la carpeta `frontend`:

```bash
cd frontend
npm install
npm start
```

Por defecto la aplicación se sirve en **http://localhost:4200/** y llama al backend en **http://127.0.0.1:8000**.

### Cambiar la URL del API (puerto u host)

Edita **`frontend/src/environments/environment.ts`** y ajusta la propiedad **`apiUrl`** si el backend no está en `127.0.0.1:8000` (por ejemplo otro puerto de `uvicorn`).

---

## Comprobar que encaja todo

1. PostgreSQL en marcha, base **`biblioteca_api`** creada y script **`01_crear_tablas_y_datos_dummy.sql`** ejecutado.
2. **`backend/.env`** con **`DATABASE_URL`** coherente con ese servidor y base (o valores por defecto en `db.py` alineados con tu instalación).
3. Backend en el puerto **8000**.
4. Frontend en el puerto **4200** (y `apiUrl` correcto si cambiaste el API).
5. Navegador en `http://localhost:4200` y, si quieres, validación de `GET /api/salud` desde la documentación en `/docs`.

---

## Build de producción (frontend)

```bash
cd frontend
npm run build
```

Los artefactos quedan en `frontend/dist/biblioteca-ui/` (configurable en `angular.json`).

---

## Notas

- **CORS**: el backend permite orígenes `http://localhost:4200` y `http://127.0.0.1:4200` (ver `backend/main.py`).
- **Borrado pasivo**: se modela con `activo = false` en `autores` y `libros`; el borrado real es `DELETE` en las rutas correspondientes de la API.
