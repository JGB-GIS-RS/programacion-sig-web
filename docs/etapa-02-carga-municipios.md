# Etapa 02. Preparación, carga y validación de los municipios del Quindío

**Proyecto:** Programación SIG Web  
**Fecha de verificación:** 20 de octubre de 2026  
**Base de datos:** `programacion_sig` (PostgreSQL 17, PostGIS 3.6.2)  
**Objetivo:** poblar la **tabla espacial propia** `public.municipio` con 12 municipios oficiales, sin reemplazar la estructura construida en la [Etapa 01](etapa-01-geodatabase.md).

## 1. Estado y alcance de la evidencia

**Completado en la instalación local del docente y comprobado mediante capturas de pgAdmin y QGIS:**

- Fuente oficial filtrada a Quindío: 12 registros.
- GeoPackage intermedio transformado a EPSG:4326, con geometría de tipo múltiple.
- Tabla de *staging* `public.municipios_quindio_2025_stg` importada con 12 registros.
- Auditoría staging: 12 filas, 12 códigos únicos, 12 con código departamental 63, 0 códigos incorrectos, 0 geometrías nulas, vacías o inválidas, 0 SRID incorrectos.
- Inserción en la tabla definitiva: mensaje PostgreSQL **`INSERT 0 12`**.
- Auditoría final: **12** en cada indicador — registros, códigos únicos, Quindío, SRID 4326, MultiPolygon y geometrías válidas.
- Consulta `INNER JOIN` entre `municipio` y `departamento`: **12 filas** correctamente relacionadas.

**Límites de la evidencia:** la auditoría staging aparecía recortada en su última columna de la captura, pero la auditoría definitiva confirma 12 multipolígonos; el tipo quedó además sujeto a la restricción del destino. No se ha realizado todavía auditoría topológica de posibles huecos, solapamientos o discrepancias de límites. No se ha medido el desempeño de los índices; tampoco existe todavía API o visor funcional en el repositorio.

Las capturas fueron revisadas durante la sesión; **no se han incorporado ni datos personales ni contraseñas al repositorio**. El GeoPackage y el contenido de la base de datos siguen en el equipo local: la documentación y los scripts son los artefactos versionados.

## 2. Fuente y campos

**Organismo:** Departamento Administrativo Nacional de Estadística (DANE).  
**Servicio:** [Divipola / Serv_DIVIPOLA_MGN_2025 / FeatureServer / Municipio (317)](https://geoportal.dane.gov.co/mparcgis/rest/services/Divipola/Serv_DIVIPOLA_MGN_2025/FeatureServer/317).  
**Versión mostrada en el atributo:** 2025.  
**Proveedor en QGIS:** ArcGIS Feature Service (`arcgisfeatureserver`).  
**Cobertura inicial del servicio consultado:** 1122 municipios, antes del filtro.  
**Filtro aplicado:** `"DPTO_CCDGO" = '63'` → **12 municipios del Quindío**.

Campos originales usados:

| Campo de la fuente | Significado | Campo en la tabla propia |
|---|---|---|
| `DPTO_CCDGO` | Código DIVIPOLA departamental | `cod_departamento` |
| `MPIO_CDPMP` | Código DIVIPOLA concatenado de 5 caracteres | `cod_municipio` |
| `MPIO_CNMBRE` | Nombre municipal | `nombre` |
| Geometría poligonal del FeatureServer | Límite municipal | `geom` |

**Importante:** no usar `MPIO_CCDGO` (código local de tres dígitos) como identificador municipal completo; usar el campo concatenado de cinco caracteres `MPIO_CDPMP`.

Los doce códigos revisados fueron:

| Municipio | DIVIPOLA | Municipio | DIVIPOLA |
|---|---|---|---|
| Armenia | 63001 | Génova | 63302 |
| Buenavista | 63111 | La Tebaida | 63401 |
| Calarcá | 63130 | Montenegro | 63470 |
| Circasia | 63190 | Pijao | 63548 |
| Córdoba | 63212 | Quimbaya | 63594 |
| Filandia | 63272 | Salento | 63690 |

## 3. Preparación del archivo vectorial en QGIS

El servicio DANE fue identificado en QGIS con tipo `Polygon (MultiPolygon)` y **EPSG:3857 — WGS 84 / Pseudo-Mercator**, en metros; la tabla propia exige **`geometry(MultiPolygon,4326)`**.

Se exportaron los **12 municipios filtrados** desde QGIS mediante `Exportar → Guardar objetos como...`:

| Parámetro | Configuración |
|---|---|
| Formato | GeoPackage |
| Archivo local | `municipios_quindio_dane_2025.gpkg` |
| Nombre de capa | `municipios_quindio_2025` |
| SRC destino | **EPSG:4326 — WGS 84** |
| Codificación | UTF-8 |
| Forzar tipo múltiple | Sí |
| Guardar solo objetos seleccionados | No (se exporta el filtro activo) |
| Índice espacial GeoPackage | Activado |

La exportación produce una **transformación real de coordenadas desde EPSG:3857 a EPSG:4326**, no una mera sustitución de etiqueta de SRID. Deben auditarse el CRS y el número de registros de la nueva capa antes de cargar.

## 4. Importación a una tabla intermedia (staging)

Desde **QGIS → Base de datos → Administrador de bases de datos → PostgreSQL → PostGIS_Programacion_SIG → Importar capa/archivo**:

- Entrada: `municipios_quindio_2025`.
- Esquema destino: `public`.
- **Tabla nueva:** `municipios_quindio_2025_stg`.
- Origen y destino: EPSG:4326.
- Columna geométrica: **`geom`**.
- Convertir nombres de campos a minúsculas: **Sí**.
- Sustituir una tabla existente: **No**.
- No crear un índice adicional en la tabla de staging para esta práctica.

Esta ruta preserva la estructura de `public.municipio`, que **no se modifica ni reemplaza**.

En pgAdmin se comprobó:

~~~sql
SELECT COUNT(*) AS total_municipios
FROM public.municipios_quindio_2025_stg;
-- 12
~~~

### Auditoría staging

El script [`sql/03_auditar_staging.sql`](../sql/03_auditar_staging.sql) comprueba conteo, códigos, geometrías nulas, vacías o inválidas, SRID y tipo geométrico, además de listar identificadores.

**Resultado observado (columnas visibles):**

| Indicador | Resultado |
|---|---:|
| Total registros | 12 |
| Municipios Quindío | 12 |
| Códigos únicos | 12 |
| Códigos incorrectos | 0 |
| Geometrías nulas | 0 |
| Geometrías vacías | 0 |
| Geometrías inválidas | 0 |
| SRID incorrecto | 0 |

La confirmación completa del tipo MultiPolygon procede de la verificación final del destino.

## 5. Inserción controlada a la tabla propia

Se realizó la transferencia desde staging con la siguiente instrucción SQL:

~~~sql
INSERT INTO public.municipio (
    cod_municipio,
    nombre,
    cod_departamento,
    geom
)
SELECT
    mpio_cdpmp,
    mpio_cnmbre,
    dpto_ccdgo,
    geom
FROM public.municipios_quindio_2025_stg;
~~~

**Evidencia observada:** `INSERT 0 12`, PostgreSQL indicó 12 filas insertadas sin errores. La tabla de destino conserva la FK, claves, restricciones geométricas y el índice GiST creados en la Etapa 01.

El repositorio incluye una [versión reproducible de la carga](../sql/04_cargar_municipios.sql) que añade transacción y validaciones previas y **bloquea su ejecución si la tabla destino ya contiene registros**.

> **No ejecutar otra vez el INSERT en la base docente actual.** La tabla `public.municipio` **ya tiene 12 filas**. Una repetición causaría conflictos de clave primaria; el script protegido también rechazará la repetición. Para reproducir el procedimiento debe utilizarse otro entorno de práctica controlado o una restauración apropiada, sin destruir datos.

## 6. Validación final

El script [`sql/05_verificar_carga.sql`](../sql/05_verificar_carga.sql) reproduce las dos consultas que se verificaron en pgAdmin:

### Auditoría geométrica y alfanumérica

~~~sql
SELECT
    COUNT(*) AS total_municipios,
    COUNT(DISTINCT cod_municipio) AS codigos_unicos,
    COUNT(*) FILTER (WHERE cod_departamento = '63') AS municipios_quindio,
    COUNT(*) FILTER (WHERE ST_SRID(geom) = 4326) AS geometria_epsg_4326,
    COUNT(*) FILTER (WHERE ST_GeometryType(geom) = 'ST_MultiPolygon')
        AS geometrias_multipolygon,
    COUNT(*) FILTER (WHERE ST_IsValid(geom)) AS geometrias_validas
FROM public.municipio;
~~~

**Resultado observado:** `12 | 12 | 12 | 12 | 12 | 12`.

### Consulta relacional

~~~sql
SELECT
    m.cod_municipio,
    m.nombre AS municipio,
    d.nombre AS departamento,
    ST_GeometryType(m.geom) AS geometria
FROM public.municipio AS m
INNER JOIN public.departamento AS d
    ON m.cod_departamento = d.cod_departamento
ORDER BY m.nombre;
~~~

**Resultado observado:** 12 municipios relacionados con Quindío, desde Armenia hasta Salento. El `INNER JOIN` valida en conjunto la recuperación y correspondencia de la tabla alfanumérica con la espacial.

## 7. Precauciones científicas y pasos posteriores

La verificación anterior **es suficiente para avanzar al desarrollo del backend**. No prueba ausencia de huecos/solapamientos entre polígonos, coincidencia exacta de límites compartidos ni exactitud posicional respecto a otras fuentes. Esto requeriría una auditoría topológica y posicional específica, que puede ejecutarse separadamente sin convertirla en un prerrequisito para enseñar API y Leaflet.

Para publicar GeoJSON en EPSG:4326 se debe usar orden de coordenadas **[longitud, latitud]**. En consultas métricas desde el navegador, **EPSG:4326 no permite interpretar grados como metros**; se utilizará `geography` o un CRS proyectado apropiado según la operación.

## 8. Continuidad hacia la Etapa 03

El próximo hito docente consiste en **crear un backend Python/FastAPI** conectado a `programacion_sig`:

1. Verificar Python y VS Code en el computador.
2. Configurar un entorno de proyecto y conexión segura a PostgreSQL.
3. Implementar **`GET /municipios`** para consultar `public.municipio`.
4. Transformar el resultado en una `FeatureCollection` GeoJSON válida.
5. Comprobar la respuesta HTTP antes de desarrollar Leaflet.

Posteriormente se implementarán las cuatro funcionalidades acordadas [F1–F4](funcionalidades.md), incluyendo `ST_Covers()` y `ST_DWithin()` ejecutados realmente en PostGIS.
