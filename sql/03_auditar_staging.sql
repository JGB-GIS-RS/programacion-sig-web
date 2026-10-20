-- PROGRAMACIÓN PARA SIG — ETAPA 02
-- Auditoría de la tabla intermedia
-- Ejecutar después de importar el GeoPackage desde QGIS a:
-- public.municipios_quindio_2025_stg
-- Tabla de consulta: NO modifica registros.

SELECT
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (
        WHERE dpto_ccdgo = '63'
    ) AS municipios_quindio,
    COUNT(DISTINCT mpio_cdpmp) AS codigos_unicos,
    COUNT(*) FILTER (
        WHERE mpio_cdpmp IS NULL
           OR mpio_cdpmp !~ '^[0-9]{5}$'
    ) AS codigos_incorrectos,
    COUNT(*) FILTER (
        WHERE geom IS NULL
    ) AS geometrias_nulas,
    COUNT(*) FILTER (
        WHERE ST_IsEmpty(geom)
    ) AS geometrias_vacias,
    COUNT(*) FILTER (
        WHERE NOT ST_IsValid(geom)
    ) AS geometrias_invalidas,
    COUNT(*) FILTER (
        WHERE ST_SRID(geom) <> 4326
    ) AS srid_incorrecto,
    COUNT(*) FILTER (
        WHERE ST_GeometryType(geom) <> 'ST_MultiPolygon'
    ) AS geometria_no_multipolygon
FROM public.municipios_quindio_2025_stg;

-- Se esperan 12 en las tres primeras columnas
-- y 0 en todas las columnas de errores.

-- Consulta complementaria: tipo geométrico y SRID
SELECT
    ST_GeometryType(geom) AS tipo_geometria,
    ST_SRID(geom) AS srid,
    COUNT(*) AS municipios
FROM public.municipios_quindio_2025_stg
GROUP BY ST_GeometryType(geom), ST_SRID(geom);
-- Esperado: ST_MultiPolygon | 4326 | 12

-- Inspección alfanumérica del origen:
SELECT mpio_cdpmp, mpio_cnmbre, dpto_ccdgo
FROM public.municipios_quindio_2025_stg
ORDER BY mpio_cdpmp;
