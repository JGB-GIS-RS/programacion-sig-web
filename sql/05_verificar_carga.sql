-- PROGRAMACIÓN PARA SIG — ETAPA 02
-- Auditoría de la tabla municipal definitiva (solo SELECT).

SELECT
    COUNT(*) AS total_municipios,
    COUNT(DISTINCT cod_municipio) AS codigos_unicos,
    COUNT(*) FILTER (
        WHERE cod_departamento = '63'
    ) AS municipios_quindio,
    COUNT(*) FILTER (
        WHERE ST_SRID(geom) = 4326
    ) AS geometria_epsg_4326,
    COUNT(*) FILTER (
        WHERE ST_GeometryType(geom) = 'ST_MultiPolygon'
    ) AS geometrias_multipolygon,
    COUNT(*) FILTER (
        WHERE ST_IsValid(geom)
    ) AS geometrias_validas
FROM public.municipio;

-- Esperado/observado en la sesión docente:
-- 12 | 12 | 12 | 12 | 12 | 12

-- Integridad referencial demostrada mediante JOIN:
SELECT
    m.cod_municipio,
    m.nombre AS municipio,
    d.nombre AS departamento,
    ST_GeometryType(m.geom) AS geometria
FROM public.municipio AS m
INNER JOIN public.departamento AS d
    ON m.cod_departamento = d.cod_departamento
ORDER BY m.nombre;

-- Esperado/observado: 12 filas del Quindío, de Armenia a Salento.
--
-- Estas comprobaciones NO equivalen a una validación topológica completa
-- del mosaico municipal (huecos, solapamientos y límites compartidos).
