"""
Conexion a PostgreSQL usando SQLAlchemy.
Lee DATABASE_URL desde variables de entorno (archivo .env opcional).
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Carga .env si existe (no falla si no esta)
load_dotenv()

# Cadena por defecto para desarrollo local; cambiala en .env
_DEFAULT_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/postgres"

DATABASE_URL = os.getenv("DATABASE_URL", _DEFAULT_URL)

# Motor: pool de conexiones hacia la base
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Fabrica de sesiones: cada peticion HTTP usara una sesion corta
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base declarativa para modelos ORM
Base = declarative_base()


def obtener_sesion():
    """
    Generador de sesion para inyectar en rutas FastAPI.
    Cierra la sesion al terminar la peticion (incluso si hay error).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
