-- =============================================================================
-- Biblioteca: tablas autores + libros y datos literarios (10 de cada uno)
--
-- Mismo esquema y mismos INSERT que 01_crear_tablas_y_datos_dummy.sql
-- (usa este archivo si prefieres el nombre "literarios"; para instalacion nueva basta con 01).
--
-- Borrado pasivo: columna activo (BOOLEAN). false = desactivado sin borrar fila; true = visible.
--
-- Cada vez que ejecutes este archivo COMPLETO:
--   1) Borra las tablas libros y autores si existen (CASCADE).
--   2) Las crea de nuevo con la estructura esperada por el backend.
--   3) Inserta los 10 autores y 10 libros.
--
-- Conecta a tu base (ej. biblioteca_api) en DBeaver o psql y ejecuta el archivo.
-- =============================================================================

DROP TABLE IF EXISTS libros CASCADE;
DROP TABLE IF EXISTS autores CASCADE;

CREATE TABLE autores (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(120) NOT NULL,
    pais        VARCHAR(80)  NOT NULL DEFAULT 'Desconocido',
    creado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    activo      BOOLEAN      NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE autores IS 'Personas que publican libros';
COMMENT ON COLUMN autores.nombre IS 'Nombre visible del autor';
COMMENT ON COLUMN autores.activo IS 'false = registro desactivado (borrado pasivo); la fila sigue en la base';

CREATE TABLE libros (
    id              SERIAL PRIMARY KEY,
    titulo          VARCHAR(200) NOT NULL,
    anio_publicacion INTEGER NOT NULL CHECK (anio_publicacion >= 1000 AND anio_publicacion <= 2100),
    precio          NUMERIC(10, 2) NOT NULL DEFAULT 0,
    id_autor        INTEGER NOT NULL,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_libros_autor
        FOREIGN KEY (id_autor)
        REFERENCES autores (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

COMMENT ON TABLE libros IS 'Catalogo de libros enlazados a autores';
COMMENT ON COLUMN libros.id_autor IS 'Clave foranea hacia autores.id';
COMMENT ON COLUMN libros.activo IS 'false = registro desactivado (borrado pasivo); la fila sigue en la base';

CREATE INDEX idx_libros_autor ON libros (id_autor);

-- -----------------------------------------------------------------------------
-- 10 autores (orden fijo: ids 1..10 al insertar en vacio)
-- activo = TRUE (borrado pasivo en API = pasar activo a FALSE sin DELETE).
-- -----------------------------------------------------------------------------
INSERT INTO autores (nombre, pais, activo) VALUES
    ('H. P. Lovecraft', 'Estados Unidos', TRUE),
    ('Jane Austen', 'Inglaterra', TRUE),
    ('Mary Shelley', 'Inglaterra', TRUE),
    ('Osamu Dazai', 'Japon', TRUE),
    ('Chuck Palahniuk', 'Estados Unidos', TRUE),
    ('Poppy Z. Brite', 'Estados Unidos', TRUE),
    ('Shirley Jackson', 'Estados Unidos', TRUE),
    ('Paul Tremblay', 'Estados Unidos', TRUE),
    ('Ernest Hemingway', 'Estados Unidos', TRUE),
    ('Thomas Ligotti', 'Estados Unidos', TRUE);

-- -----------------------------------------------------------------------------
-- 10 libros (id_autor 1..10 alineado con el orden de insercion anterior)
-- activo = TRUE en todos (borrado pasivo = pasar a FALSE sin DELETE).
-- -----------------------------------------------------------------------------
INSERT INTO libros (titulo, anio_publicacion, precio, id_autor, activo) VALUES
    ('El color que surgio del espacio', 1927, 16.90, 1, TRUE),
    ('Persuasion', 1817, 14.50, 2, TRUE),
    ('Frankenstein o el moderno Prometeo', 1818, 15.00, 3, TRUE),
    ('Indigno de ser humano', 1948, 17.25, 4, TRUE),
    ('El club de la lucha', 1996, 18.00, 5, TRUE),
    ('Cadaveres exquisitos', 1996, 19.40, 6, TRUE),
    ('Siempre hemos vivido en el castillo', 1962, 16.75, 7, TRUE),
    ('Una cabeza llena de fantasmas', 2015, 20.50, 8, TRUE),
    ('El viejo y el mar', 1952, 13.99, 9, TRUE),
    ('Songs of a Dead Dreamer', 1986, 21.00, 10, TRUE);

-- Verificacion (opcional)
-- SELECT a.id, a.nombre, l.titulo, l.anio_publicacion
-- FROM libros l JOIN autores a ON a.id = l.id_autor ORDER BY a.id;
