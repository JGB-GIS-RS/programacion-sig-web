-- ========================================================
-- PROGRAMACIÓN PARA SIG
-- GEODATABASE: MUNICIPIOS DEL QUINDÍO
-- Etapa 01: implementación física
--
-- Ejecutar UNA vez en la base de datos programacion_sig.
-- Requisito: extensión PostGIS activada.
-- No ejecutar sobre tablas existentes con información.
-- ========================================================

BEGIN;

-- 1. Entidad departamento
CREATE TABLE public.departamento (
    cod_departamento VARCHAR(2) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,

    CONSTRAINT chk_dpto_codigo
        CHECK (cod_departamento ~ '^[0-9]{2}$'),

    CONSTRAINT chk_dpto_nombre
        CHECK (BTRIM(nombre) <> '')
);

-- 2. Entidad municipio
CREATE TABLE public.municipio (
    cod_municipio VARCHAR(5) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    cod_departamento VARCHAR(2) NOT NULL,
    geom geometry(MultiPolygon, 4326) NOT NULL,

    CONSTRAINT fk_municipio_departamento
        FOREIGN KEY (cod_departamento)
        REFERENCES public.departamento(cod_departamento),

    CONSTRAINT chk_mpio_codigo
        CHECK (cod_municipio ~ '^[0-9]{5}$'),

    CONSTRAINT chk_mpio_departamento
        CHECK (LEFT(cod_municipio, 2) = cod_departamento),

    CONSTRAINT chk_mpio_nombre
        CHECK (BTRIM(nombre) <> ''),

    CONSTRAINT chk_mpio_geom_valida
        CHECK (ST_IsValid(geom)),

    CONSTRAINT chk_mpio_geom_no_vacia
        CHECK (NOT ST_IsEmpty(geom))
);

-- 3. Índice espacial
CREATE INDEX idx_municipio_geom
ON public.municipio
USING GIST (geom);

-- 4. Registro del departamento del Quindío
INSERT INTO public.departamento
    (cod_departamento, nombre)
VALUES
    ('63', 'Quindío');

COMMIT;
