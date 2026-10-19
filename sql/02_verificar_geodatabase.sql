-- ========================================================
-- PROGRAMACIÓN PARA SIG
-- Etapa 01: verificación de la estructura
-- Ejecutar DESPUÉS del script de creación.
-- ========================================================

-- 1. Conteo de registros: inicialmente 1 departamento y 0 municipios
SELECT 'departamento' AS tabla,
       COUNT(*) AS registros
FROM public.departamento

UNION ALL

SELECT 'municipio' AS tabla,
       COUNT(*) AS registros
FROM public.municipio;

-- 2. Confirmar el registro inicial de Quindío
SELECT cod_departamento, nombre
FROM public.departamento;

-- 3. Confirmar que PostGIS responde en esta misma base de datos
SELECT PostGIS_Full_Version();

-- 4. Confirmar el índice espacial sobre municipio.geom
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'municipio'
ORDER BY indexname;
