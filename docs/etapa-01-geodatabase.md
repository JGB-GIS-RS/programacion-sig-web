# Etapa 01. Diseño físico e implementación de la geodatabase

**Asignatura:** Programación para SIG  
**Proyecto:** Programación SIG Web  
**Territorio de estudio:** municipios del Quindío, Colombia  
**Base de datos:** `programacion_sig` · **Esquema:** `public`

> **Estado:** guía y scripts de implementación disponibles en GitHub. Su publicación **no acredita** que las tablas ya hayan sido creadas en la instalación local del docente. La ejecución y la verificación se realizarán en pgAdmin 4.

## 1. Propósito de esta etapa

Construir **nosotros mismos** una estructura geoespacial mínima para soportar las consultas futuras del geovisor. Los datos del DANE se usarán **después para poblar** las tablas; **no determinan automáticamente nuestro diseño físico**.

Los estudiantes ya aprobaron Bases de Datos Geográficas: recordaremos brevemente modelo, claves, geometría, SRID e integridad, sin repetir una unidad de diseño relacional. Lo central del proyecto seguirá siendo programar consultas desde Leaflet, mediante FastAPI, sobre PostGIS.

## 2. Modelo de datos aprobado

Relación entre dos entidades:

~~~mermaid
erDiagram
    DEPARTAMENTO ||--o{ MUNICIPIO : contiene
    DEPARTAMENTO {
        varchar_2 cod_departamento PK
        varchar_100 nombre
    }
    MUNICIPIO {
        varchar_5 cod_municipio PK
        varchar_100 nombre
        varchar_2 cod_departamento FK
        MultiPolygon_4326 geom
    }
~~~

| Tabla | Naturaleza | Cardinalidad / función |
|---|---|---|
| `public.departamento` | Alfanumérica | Un departamento contiene varios municipios (1:N) |
| `public.municipio` | Geográfica, multipoligonal | Cada municipio pertenece a un departamento y contiene su geometría |

### Tabla `departamento`

| Campo | Tipo | Restricciones |
|---|---|---|
| `cod_departamento` | `VARCHAR(2)` | Clave primaria, exactamente dos dígitos |
| `nombre` | `VARCHAR(100)` | `NOT NULL`, no vacío ni compuesto solamente por espacios |

Inicialmente contendrá un registro: código DIVIPOLA `63`, nombre `Quindío`.

### Tabla `municipio`

| Campo | Tipo | Restricciones |
|---|---|---|
| `cod_municipio` | `VARCHAR(5)` | Clave primaria, exactamente cinco dígitos |
| `nombre` | `VARCHAR(100)` | `NOT NULL`, no vacío |
| `cod_departamento` | `VARCHAR(2)` | `NOT NULL`, clave foránea a `departamento` |
| `geom` | `geometry(MultiPolygon,4326)` | `NOT NULL`, válida y no vacía |

**Decisiones técnicas fundamentales:**

- **Identificación:** códigos oficiales almacenados como texto; preservan longitud y ceros iniciales.
- **Relación:** clave foránea `municipio.cod_departamento` → `departamento.cod_departamento`; los dos primeros caracteres del código municipal deben coincidir con el código departamental.
- **Geometría:** multipolígono en EPSG:4326, con controles individuales de validez y no vaciedad.
- **Consulta espacial:** índice GiST sobre `municipio.geom`.
- **Área:** no se persiste como campo obligatorio; será calculable desde PostGIS. El área geométrica calculada no debe confundirse con una cifra oficial reportada.
- **SRID:** EPSG:4326 facilita la publicación GeoJSON, pero **no convierte los grados en metros**. Las distancias de F4 se calcularán con `geography` o CRS apropiado.
- **Límite de estas restricciones:** `ST_IsValid()` no demuestra ausencia de solapamientos, huecos o desacuerdos entre polígonos vecinos. La auditoría territorial vendrá después de cargar datos.

## 3. Antes de ejecutar

Se requiere que la instalación local tenga:

- PostgreSQL 17 operativo; PostGIS habilitado en la base `programacion_sig` (ya se verificó previamente en la práctica guiada).
- pgAdmin 4 con acceso a esa base de datos.
- Privilegios para crear tablas, restricciones e índices en `public`.
- **Ninguna tabla previa con esos mismos nombres que se desee conservar**.

**No es un script de migración ni un script idempotente**: el archivo utiliza `CREATE TABLE` sin `IF NOT EXISTS`. No se debe ejecutar dos veces sobre las tablas creadas ni eliminar tablas existentes para volver a empezar sin hacer copia y revisar sus datos.

### Paso 1. Abrir el editor SQL

En pgAdmin 4:

1. Desplegar **Servers → PostgreSQL 17 → Databases**.
2. Hacer clic derecho sobre `programacion_sig`.
3. Seleccionar **Query Tool**.
4. Verificar en la pestaña del editor que la conexión corresponde a `programacion_sig`, **no** a `postgres`.

### Paso 2. Ejecutar las instrucciones SQL

**Script ejecutable del repositorio:** [`sql/01_crear_geodatabase.sql`](../sql/01_crear_geodatabase.sql).

Copiar el archivo completo al editor o abrirlo desde Query Tool y ejecutarlo con **F5** / *Execute Script*.

~~~sql
-- ========================================================
-- PROGRAMACIÓN PARA SIG
-- GEODATABASE: MUNICIPIOS DEL QUINDÍO
-- Etapa 01: implementación física
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
~~~

La transacción agrupa creación de tablas, índice e inserción. **Si se produce un error, no considerar terminado el proceso**; revisar el mensaje y ejecutar `ROLLBACK;` si la sesión queda en transacción abortada, antes de corregir y reintentar. No intentar recrear tablas parcialmente existentes sin inspeccionarlas.

## 4. Verificar la construcción

En Query Tool, abrir una **nueva consulta**, conectada a `programacion_sig`, y ejecutar:

~~~sql
SELECT 'departamento' AS tabla,
       COUNT(*) AS registros
FROM public.departamento

UNION ALL

SELECT 'municipio' AS tabla,
       COUNT(*) AS registros
FROM public.municipio;
~~~

**Resultado esperado antes de importar cartografía:**

| tabla | registros |
|---|---:|
| departamento | 1 |
| municipio | 0 |

Este resultado es correcto: se creó la estructura y se registró el Quindío, pero todavía no se ha cargado ningún municipio.

**Archivo complementario:** [`sql/02_verificar_geodatabase.sql`](../sql/02_verificar_geodatabase.sql), que también comprueba el registro departamental, `PostGIS_Full_Version()` y el índice espacial. En pgAdmin se puede actualizar (*Refresh*) el árbol `Schemas → public → Tables` para observar ambas tablas.

## 5. Alcance de las restricciones

La clave primaria evita códigos duplicados dentro de cada tabla. La clave foránea exige que el departamento exista. Los `CHECK` controlan forma de los códigos, coincidencia del prefijo departamental y propiedades geométricas individuales.

No se han impuesto restricciones universales sobre nombres únicos, número fijo de departamentos, geometrías sin intersecciones entre municipios o área superficial: requieren definición y validación adicional del dominio. Por ahora no crearemos índices o relaciones extra sin justificación. Con doce municipios, el GiST tiene sobre todo **valor formativo**; no se presupone una mejora de rendimiento medible.

## 6. Siguientes operaciones (todavía no ejecutadas)

Una vez validada la estructura:

1. Obtener la cartografía municipal oficial del DANE.
2. Registrar versión, fecha, campos, códigos DIVIPOLA y CRS de origen.
3. Filtrar los doce municipios del Quindío y auditar geometrías.
4. Si corresponde, transformar **coordenadas** al CRS de destino (no limitarse a `ST_SetSRID()`).
5. Incorporar los registros a nuestra propia tabla `public.municipio`, respetando claves, restricciones y geometría multipoligonal.
6. Verificar doce registros, SRID, geometrías válidas y consistencia territorial desde pgAdmin/QGIS.
7. Empezar **F1: `GET /municipios` con FastAPI**, que recuperará esos datos y los publicará como GeoJSON en Leaflet.

**Por ahora, la evidencia docente requerida es una captura de la consulta de verificación con `departamento = 1` y `municipio = 0`.** Ese hito separa la construcción de la estructura de la carga de datos y de la futura integración web.

## 7. Relación con el resultado final del curso

Esta etapa no es el objetivo central de la asignatura. Su función es asegurar que la geodatabase utilizada por el geovisor fue **diseñada e implementada conscientemente**, y no aceptada de forma automática al importar una capa.

Después se implementarán [F1–F4](funcionalidades.md): publicación, consulta de detalle, identificación espacial por punto y proximidad espacial por distancia. Todas las consultas remotas deben poder trazarse en el recorrido **Leaflet → FastAPI → PostgreSQL/PostGIS → FastAPI → Leaflet**.
