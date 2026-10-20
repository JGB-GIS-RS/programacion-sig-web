-- PROGRAMACIÓN PARA SIG — ETAPA 02
-- REPRODUCCIÓN DE LA TRANSFERENCIA SOLO SOBRE UNA TABLA DESTINO VACÍA.
--
-- ADVERTENCIA: en la base docente se han insertado ya los 12 municipios.
-- NO ejecutar de nuevo allí: repetir el INSERT causaría errores de PK.
-- Este script es para un entorno nuevo / una restauración controlada.
--
-- Requiere las tablas creadas en la Etapa 01 y la tabla staging auditada.

BEGIN;

DO $carga$
DECLARE
    n_origen integer;
    n_insertados integer;
BEGIN
    SELECT COUNT(*) INTO n_origen
    FROM public.municipios_quindio_2025_stg;

    IF n_origen <> 12 THEN
        RAISE EXCEPTION 'Carga cancelada: staging debe contener 12 filas; contiene %', n_origen;
    END IF;

    IF EXISTS (SELECT 1 FROM public.municipio) THEN
        RAISE EXCEPTION 'Carga cancelada: public.municipio no está vacía. No repetir la inserción.';
    END IF;

    IF (
      SELECT COUNT(DISTINCT mpio_cdpmp)
      FROM public.municipios_quindio_2025_stg
    ) <> 12 THEN
        RAISE EXCEPTION 'Carga cancelada: identificadores municipales duplicados.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.municipios_quindio_2025_stg
        WHERE mpio_cdpmp IS NULL
           OR mpio_cdpmp !~ '^[0-9]{5}$'
           OR dpto_ccdgo IS DISTINCT FROM '63'
           OR LEFT(mpio_cdpmp, 2) <> dpto_ccdgo
           OR mpio_cnmbre IS NULL
           OR BTRIM(mpio_cnmbre) = ''
           OR geom IS NULL
           OR COALESCE(ST_IsEmpty(geom), TRUE)
           OR NOT COALESCE(ST_IsValid(geom), FALSE)
           OR ST_SRID(geom) IS DISTINCT FROM 4326
           OR ST_GeometryType(geom) IS DISTINCT FROM 'ST_MultiPolygon'
    ) THEN
        RAISE EXCEPTION 'Carga cancelada: staging no supera las reglas de integridad.';
    END IF;

    INSERT INTO public.municipio
        (cod_municipio, nombre, cod_departamento, geom)
    SELECT
        mpio_cdpmp, mpio_cnmbre, dpto_ccdgo, geom
    FROM public.municipios_quindio_2025_stg;

    GET DIAGNOSTICS n_insertados = ROW_COUNT;
    IF n_insertados <> 12 THEN
        RAISE EXCEPTION 'Carga inesperada: se insertaron % registros', n_insertados;
    END IF;
END
$carga$;

COMMIT;
-- En la ejecución original documentada se observó: INSERT 0 12.
-- Este script incorpora protecciones adicionales para una reproducción futura.
