"""
Esquemas Pydantic: validan JSON de entrada y forman JSON de salida.
Separan la capa HTTP de la capa de base de datos.
"""

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class AutorBase(BaseModel):
    """Campos comunes de autor (nombre, pais)."""

    nombre: str = Field(..., min_length=1, max_length=120, description="Nombre completo o como se muestra en catalogo.")
    pais: str = Field(default="Desconocido", max_length=80, description="Pais de origen o nacionalidad habitual.")


class AutorCrear(AutorBase):
    """Cuerpo para POST /api/autores y PUT /api/autores/{id} (reemplazo completo)."""


class AutorParcial(BaseModel):
    """Cuerpo para PATCH /api/autores/{id}: solo envia los campos que quieras cambiar."""

    nombre: str | None = Field(default=None, min_length=1, max_length=120, description="Nuevo nombre (opcional).")
    pais: str | None = Field(default=None, max_length=80, description="Nuevo pais (opcional).")
    activo: bool | None = Field(
        default=None,
        description="False = borrado pasivo (fila sigue en BD). True = reactivar.",
    )


class AutorLeer(AutorBase):
    """Respuesta al leer o crear un autor: incluye id y bandera activo."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Clave primaria generada por PostgreSQL.")
    activo: bool = Field(..., description="False si el registro esta desactivado (borrado pasivo).")


class LibroBase(BaseModel):
    """Campos comunes de libro."""

    titulo: str = Field(..., min_length=1, max_length=200, description="Titulo del libro.")
    anio_publicacion: int = Field(..., ge=1000, le=2100, description="Anio de publicacion (primera edicion habitual).")
    precio: Decimal = Field(default=Decimal("0.00"), ge=0, description="Precio de venta; decimal con dos decimales.")
    id_autor: int = Field(..., ge=1, description="Debe existir en la tabla autores y preferiblemente activo.")


class LibroCrear(LibroBase):
    """Cuerpo para POST /api/libros y PUT /api/libros/{id}."""


class LibroParcial(BaseModel):
    """Cuerpo para PATCH /api/libros/{id}: campos opcionales."""

    titulo: str | None = Field(default=None, min_length=1, max_length=200)
    anio_publicacion: int | None = Field(default=None, ge=1000, le=2100)
    precio: Decimal | None = Field(default=None, ge=0)
    id_autor: int | None = Field(default=None, ge=1, description="Cambiar autor del libro (debe existir y estar activo).")
    activo: bool | None = Field(
        default=None,
        description="False = borrado pasivo del libro. True = reactivar.",
    )


class LibroLeer(LibroBase):
    """Respuesta al leer o crear un libro: incluye id y activo."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Clave primaria del libro.")
    activo: bool = Field(..., description="False si el libro esta desactivado (borrado pasivo).")
