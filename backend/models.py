"""
Modelos ORM: reflejan tablas autores y libros.
Los nombres de columnas coinciden con el script SQL en database/.
"""

from sqlalchemy import Boolean, Column, ForeignKey, Integer, Numeric, String, TIMESTAMP, func
from sqlalchemy.orm import relationship

from db import Base


class Autor(Base):
    """Representa la tabla autores."""

    __tablename__ = "autores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(120), nullable=False)
    pais = Column(String(80), nullable=False, default="Desconocido")
    creado_en = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    activo = Column(Boolean, nullable=False, default=True, server_default="true")

    # Un autor tiene muchos libros (lazy load)
    libros = relationship("Libro", back_populates="autor")


class Libro(Base):
    """Representa la tabla libros."""

    __tablename__ = "libros"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    anio_publicacion = Column(Integer, nullable=False)
    precio = Column(Numeric(10, 2), nullable=False, default=0)
    id_autor = Column(Integer, ForeignKey("autores.id", ondelete="RESTRICT"), nullable=False)
    activo = Column(Boolean, nullable=False, default=True, server_default="true")

    autor = relationship("Autor", back_populates="libros")
