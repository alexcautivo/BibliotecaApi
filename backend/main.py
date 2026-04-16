"""
API REST de ejemplo: autores y libros en PostgreSQL.
Metodos HTTP: GET, POST, PUT, PATCH, DELETE (borrado real) y PATCH activo=false (borrado pasivo).

Documentacion interactiva: http://127.0.0.1:8000/docs
"""

from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db import obtener_sesion
from models import Autor, Libro
from schemas import (
    AutorCrear,
    AutorLeer,
    AutorParcial,
    LibroCrear,
    LibroLeer,
    LibroParcial,
)

_DESCRIPCION_API = """
## Biblioteca API

API REST de demostracion sobre **PostgreSQL**: gestiona **autores** y **libros** enlazados por clave foranea.

### Convenciones

| Concepto | Comportamiento |
|----------|----------------|
| **Listados** | Por defecto solo registros con `activo=true`. Query `incluir_inactivos=true` para ver tambien desactivados. |
| **Borrado pasivo** | `PATCH` con `{"activo": false}`: la fila sigue en la base; no aparece en listados normales. |
| **Borrado real** | `DELETE` elimina la fila. Un autor con libros asociados no se puede borrar (409). |
| **Errores** | Cuerpo JSON con `detail` y a veces `error_code` (p. ej. `VALIDATION_ERROR`, `INTEGRITY_ERROR`). |

### CORS

Origen permitido para el front en desarrollo: `http://localhost:4200` y `http://127.0.0.1:4200`.

### Documentacion interactiva

En `/docs` las operaciones estan **agrupadas por metodo HTTP** (GET, POST, PUT, PATCH, DELETE). Dentro de cada grupo veras **Sistema**, **Autores** y **Libros** en el resumen de cada operacion.
"""

# Etiquetas OpenAPI agrupadas por METODO HTTP (prefijo numerico: orden GET..DELETE en Swagger UI).
_TAG_GET = "1 - GET"
_TAG_POST = "2 - POST"
_TAG_PUT = "3 - PUT"
_TAG_PATCH = "4 - PATCH"
_TAG_DELETE = "5 - DELETE"

_TAGS_OPENAPI = [
    {
        "name": _TAG_GET,
        "description": (
            "**Lecturas** sin efectos secundarios: salud del servicio, listados y obtencion por `id`. "
            "Query `incluir_inactivos` donde aplique."
        ),
    },
    {
        "name": _TAG_POST,
        "description": "**Creacion** de autores o libros nuevos (cuerpo JSON segun esquema *Crear).",
    },
    {
        "name": _TAG_PUT,
        "description": "**Reemplazo completo** del recurso (mismo cuerpo que en POST de creacion).",
    },
    {
        "name": _TAG_PATCH,
        "description": (
            "**Actualizacion parcial**; envia solo campos a cambiar. "
            "Incluye **borrado pasivo** con `{\"activo\": false}`."
        ),
    },
    {
        "name": _TAG_DELETE,
        "description": "**Borrado definitivo** de la fila en PostgreSQL (no confundir con borrado pasivo).",
    },
]

app = FastAPI(
    title="Biblioteca API",
    version="1.1.0",
    description=_DESCRIPCION_API,
    openapi_tags=_TAGS_OPENAPI,
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_parameters={
        "docExpansion": "list",
        "operationsSorter": "alpha",
        "filter": True,
        "displayRequestDuration": True,
    },
)


def custom_openapi():
    """
    Regenera OpenAPI desde las rutas registradas y fija la lista `tags` en el orden GET..DELETE.
    Evita que el cliente de documentacion muestre el grupo 'default' o titulos viejos por caché.
    """
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
        tags=_TAGS_OPENAPI,
    )
    # Orden explícito de secciones (Swagger UI ordena etiquetas alfabéticamente si no se fuerza)
    schema["tags"] = [dict(t) for t in _TAGS_OPENAPI]
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi


class _NoCacheDocsMiddleware(BaseHTTPMiddleware):
    """Evita que el navegador sirva un openapi.json antiguo (misma URL, otro proceso)."""

    async def dispatch(self, request, call_next):
        response = await call_next(request)
        p = request.url.path
        if p in ("/openapi.json", "/docs", "/redoc") or p.startswith("/docs/"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
        return response


app.add_middleware(_NoCacheDocsMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validacion_handler(_, exc: RequestValidationError):
    errores = exc.errors()
    resumen = []
    for e in errores:
        ruta = " -> ".join(str(x) for x in e.get("loc", ()))
        resumen.append(f"{ruta}: {e.get('msg')}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Los datos enviados no cumplen las reglas de validacion.",
            "error_code": "VALIDATION_ERROR",
            "field_messages": resumen,
            "errors": errores,
        },
    )


@app.exception_handler(IntegrityError)
async def integridad_handler(_, exc: IntegrityError):
    return JSONResponse(
        status_code=409,
        content={
            "detail": "Conflicto con la base de datos (clave foranea, unica u otra restriccion). Revisa relaciones entre tablas.",
            "error_code": "INTEGRITY_ERROR",
        },
    )


SesionDB = Annotated[Session, Depends(obtener_sesion)]


def _autor_accesible(autor: Autor | None, incluir_inactivos: bool) -> Autor:
    if autor is None:
        raise HTTPException(status_code=404, detail="Autor no encontrado")
    if not autor.activo and not incluir_inactivos:
        raise HTTPException(
            status_code=404,
            detail="Autor no encontrado o desactivado (delete pasivo). Usa incluir_inactivos=true para verlo.",
        )
    return autor


def _libro_accesible(libro: Libro | None, incluir_inactivos: bool) -> Libro:
    if libro is None:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    if not libro.activo and not incluir_inactivos:
        raise HTTPException(
            status_code=404,
            detail="Libro no encontrado o desactivado (delete pasivo). Usa incluir_inactivos=true para verlo.",
        )
    return libro


@app.get(
    "/api/salud",
    tags=[_TAG_GET],
    summary="[Sistema] Salud y capacidades de la API",
    description="""
Devuelve un JSON con:

- `estado` y `mensaje`: confirmacion basica.
- `revision`: identificador de version del codigo desplegado.
- `capacidades`: flags que el front puede usar para verificar que el backend expone DELETE y borrado pasivo.

No consulta la base de datos: sirve para comprobar conectividad HTTP.
""",
    response_description="Objeto con estado, revision y capacidades opcionales.",
)
def salud():
    return {
        "estado": "ok",
        "mensaje": "API biblioteca operativa",
        "revision": "2026-04-openapi-tags-por-metodo",
        "capacidades": {"delete_http": True, "borrado_pasivo": True},
    }


# ----------------------------- AUTORES -------------------------------------


@app.get(
    "/api/autores",
    response_model=list[AutorLeer],
    tags=[_TAG_GET],
    summary="[Autores] Listar todos",
    description="""
Devuelve autores ordenados por `id`.

- Sin query: solo filas con `activo=true`.
- Con `incluir_inactivos=true`: tambien autores desactivados (borrado pasivo).
""",
    response_description="Lista de autores; cada elemento incluye `id`, `nombre`, `pais`, `activo`.",
)
def listar_autores(
    db: SesionDB,
    incluir_inactivos: bool = Query(
        False,
        description="Si es `true`, incluye autores con `activo=false` (borrado pasivo).",
    ),
):
    q = db.query(Autor)
    if not incluir_inactivos:
        q = q.filter(Autor.activo.is_(True))
    return q.order_by(Autor.id).all()


@app.get(
    "/api/autores/{autor_id}",
    response_model=AutorLeer,
    tags=[_TAG_GET],
    summary="[Autores] Obtener por id",
    description="""
Busca un autor por `autor_id`.

- Si no existe: **404**.
- Si existe pero esta desactivado y no pasas `incluir_inactivos=true`: **404** (comportamiento de recurso oculto).
""",
    response_description="Autor con todos los campos de lectura.",
)
def obtener_autor(
    autor_id: int,
    db: SesionDB,
    incluir_inactivos: bool = Query(
        False,
        description="Permite leer un autor desactivado (`activo=false`) cuando es `true`.",
    ),
):
    autor = db.get(Autor, autor_id)
    return _autor_accesible(autor, incluir_inactivos)


@app.post(
    "/api/autores",
    response_model=AutorLeer,
    status_code=201,
    tags=[_TAG_POST],
    summary="[Autores] Crear",
    description="""
Crea un autor nuevo. El cuerpo debe incluir `nombre` y `pais` (ver esquema **AutorCrear**).

Se crea siempre con `activo=true`.
""",
    response_description="Autor creado con `id` generado por la base.",
)
def crear_autor(datos: AutorCrear, db: SesionDB):
    nuevo = Autor(nombre=datos.nombre, pais=datos.pais, activo=True)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@app.put(
    "/api/autores/{autor_id}",
    response_model=AutorLeer,
    tags=[_TAG_PUT],
    summary="[Autores] Reemplazar completo",
    description="""
Sustituye **todos** los campos editables del autor (`nombre`, `pais`) con el cuerpo enviado.

No modifica `activo` desde este endpoint; usa PATCH para eso.
""",
    response_description="Autor actualizado.",
)
def reemplazar_autor(autor_id: int, datos: AutorCrear, db: SesionDB):
    autor = db.get(Autor, autor_id)
    if autor is None:
        raise HTTPException(status_code=404, detail="Autor no encontrado")
    autor.nombre = datos.nombre
    autor.pais = datos.pais
    db.commit()
    db.refresh(autor)
    return autor


@app.patch(
    "/api/autores/{autor_id}",
    response_model=AutorLeer,
    tags=[_TAG_PATCH],
    summary="[Autores] Parchear (borrado pasivo: activo)",
    description="""
Actualiza solo los campos enviados (no nulos en el JSON):

- `nombre`, `pais`
- **`activo`**: `false` para borrado pasivo, `true` para reactivar.

Ejemplo de borrado pasivo: `{"activo": false}`.
""",
    response_description="Autor tras aplicar los cambios.",
)
def actualizar_autor_parcial(autor_id: int, datos: AutorParcial, db: SesionDB):
    autor = db.get(Autor, autor_id)
    if autor is None:
        raise HTTPException(status_code=404, detail="Autor no encontrado")
    if datos.nombre is not None:
        autor.nombre = datos.nombre
    if datos.pais is not None:
        autor.pais = datos.pais
    if datos.activo is not None:
        autor.activo = datos.activo
    db.commit()
    db.refresh(autor)
    return autor


@app.delete(
    "/api/autores/{autor_id}",
    status_code=204,
    tags=[_TAG_DELETE],
    summary="[Autores] Eliminar fila (definitivo)",
    description="""
Elimina **definitivamente** la fila del autor.

**409** si aun tiene libros asociados (`id_autor`). En ese caso elimina o reasigna libros, o usa PATCH con `activo=false` para ocultar el autor sin borrarlo.
""",
    response_description="Sin cuerpo (204 No Content) si se elimino correctamente.",
)
def eliminar_autor(autor_id: int, db: SesionDB):
    autor = db.get(Autor, autor_id)
    if autor is None:
        raise HTTPException(status_code=404, detail="Autor no encontrado")
    n_libros = db.query(Libro).filter(Libro.id_autor == autor_id).count()
    if n_libros > 0:
        raise HTTPException(
            status_code=409,
            detail=(
                f"No se puede eliminar el autor: hay {n_libros} libro(s) asociado(s). "
                "Elimina o reasigna esos libros primero, o usa PATCH con activo=false (delete pasivo)."
            ),
        )
    db.delete(autor)
    db.commit()
    return None


# ----------------------------- LIBROS --------------------------------------


@app.get(
    "/api/libros",
    response_model=list[LibroLeer],
    tags=[_TAG_GET],
    summary="[Libros] Listar todos",
    description="""
Lista libros ordenados por `id`.

- Por defecto: solo libros **activos** cuyo **autor** tambien este **activo**.
- Con `incluir_inactivos=true`: tambien aparecen libros con `activo=false` (y combinaciones con autor inactivo segun filtro en la consulta).
""",
    response_description="Lista de libros con sus campos y `id_autor`.",
)
def listar_libros(
    db: SesionDB,
    incluir_inactivos: bool = Query(
        False,
        description="Si es `true`, incluye libros desactivados; si `false`, solo activos con autor activo.",
    ),
):
    q = db.query(Libro).join(Autor, Libro.id_autor == Autor.id)
    if not incluir_inactivos:
        q = q.filter(and_(Libro.activo.is_(True), Autor.activo.is_(True)))
    return q.order_by(Libro.id).all()


@app.get(
    "/api/libros/{libro_id}",
    response_model=LibroLeer,
    tags=[_TAG_GET],
    summary="[Libros] Obtener por id",
    description="Misma logica que un autor: un libro desactivado requiere `incluir_inactivos=true` para verlo.",
    response_description="Libro encontrado.",
)
def obtener_libro(
    libro_id: int,
    db: SesionDB,
    incluir_inactivos: bool = Query(
        False,
        description="Permite leer un libro desactivado cuando es `true`.",
    ),
):
    libro = db.get(Libro, libro_id)
    return _libro_accesible(libro, incluir_inactivos)


@app.post(
    "/api/libros",
    response_model=LibroLeer,
    status_code=201,
    tags=[_TAG_POST],
    summary="[Libros] Crear",
    description="""
Crea un libro. `id_autor` debe existir y el autor debe estar **activo**.

**400** si el autor no existe o esta desactivado.
""",
    response_description="Libro creado con `id` generado.",
)
def crear_libro(datos: LibroCrear, db: SesionDB):
    existe_autor = db.get(Autor, datos.id_autor)
    if existe_autor is None:
        raise HTTPException(status_code=400, detail="id_autor no existe en la tabla autores")
    if not existe_autor.activo:
        raise HTTPException(
            status_code=400,
            detail="No se puede asignar un libro a un autor desactivado. Reactiva el autor o elige otro id_autor.",
        )
    nuevo = Libro(
        titulo=datos.titulo,
        anio_publicacion=datos.anio_publicacion,
        precio=datos.precio,
        id_autor=datos.id_autor,
        activo=True,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@app.put(
    "/api/libros/{libro_id}",
    response_model=LibroLeer,
    tags=[_TAG_PUT],
    summary="[Libros] Reemplazar completo",
    description="Reemplaza todos los campos del libro con el mismo cuerpo que en POST (`LibroCrear`).",
    response_description="Libro actualizado.",
)
def reemplazar_libro(libro_id: int, datos: LibroCrear, db: SesionDB):
    libro = db.get(Libro, libro_id)
    if libro is None:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    existe_autor = db.get(Autor, datos.id_autor)
    if existe_autor is None:
        raise HTTPException(status_code=400, detail="id_autor no existe en la tabla autores")
    if not existe_autor.activo:
        raise HTTPException(
            status_code=400,
            detail="No se puede asignar un libro a un autor desactivado.",
        )
    libro.titulo = datos.titulo
    libro.anio_publicacion = datos.anio_publicacion
    libro.precio = datos.precio
    libro.id_autor = datos.id_autor
    db.commit()
    db.refresh(libro)
    return libro


@app.patch(
    "/api/libros/{libro_id}",
    response_model=LibroLeer,
    tags=[_TAG_PATCH],
    summary="[Libros] Parchear (borrado pasivo: activo)",
    description="""
Actualiza solo los campos enviados: `titulo`, `anio_publicacion`, `precio`, `id_autor`, **`activo`**.

Para borrado pasivo: `{"activo": false}`.
""",
    response_description="Libro tras aplicar los cambios.",
)
def actualizar_libro_parcial(libro_id: int, datos: LibroParcial, db: SesionDB):
    libro = db.get(Libro, libro_id)
    if libro is None:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    if datos.titulo is not None:
        libro.titulo = datos.titulo
    if datos.anio_publicacion is not None:
        libro.anio_publicacion = datos.anio_publicacion
    if datos.precio is not None:
        libro.precio = datos.precio
    if datos.id_autor is not None:
        existe_autor = db.get(Autor, datos.id_autor)
        if existe_autor is None:
            raise HTTPException(status_code=400, detail="id_autor no existe en la tabla autores")
        if not existe_autor.activo:
            raise HTTPException(
                status_code=400,
                detail="No se puede asignar un libro a un autor desactivado.",
            )
        libro.id_autor = datos.id_autor
    if datos.activo is not None:
        libro.activo = datos.activo
    db.commit()
    db.refresh(libro)
    return libro


@app.delete(
    "/api/libros/{libro_id}",
    status_code=204,
    tags=[_TAG_DELETE],
    summary="[Libros] Eliminar fila (definitivo)",
    description="Borra definitivamente el libro. No hay restriccion por autor salvo la integridad referencial habitual.",
    response_description="Sin cuerpo (204 No Content) si se elimino correctamente.",
)
def eliminar_libro(libro_id: int, db: SesionDB):
    libro = db.get(Libro, libro_id)
    if libro is None:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    db.delete(libro)
    db.commit()
    return None
