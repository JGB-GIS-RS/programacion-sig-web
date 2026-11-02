# Modelo de referencia vigente — Geodatabase del Quindío

**Versión documental:** 2 de noviembre de 2026. Separa lo **verificado en archivos del repositorio** de lo **observado en el equipo docente**.

## 1. De dos a cuatro tablas

La Etapa 01 creó `departamento` y `municipio`; la Etapa 02 cargó los municipios; posteriormente el proyecto incorporó `tipo_equipamiento` y `equipamiento`. El modelo final tiene **cuatro tablas**, sin contar tablas temporales de preparación.

| Tabla | Filas observadas | Claves y geometría relevantes |
|---|---:|---|
| `public.departamento` | 1 | `cod_departamento` PK; no geométrica |
| `public.municipio` | 12 | `cod_municipio` PK, `cod_departamento` FK, `geom geometry(MultiPolygon,4326)` |
| `public.tipo_equipamiento` | 2 | `id_tipo` PK y categoría |
| `public.equipamiento` | 645 | `id_equipamiento` PK, `cod_municipio` FK, `id_tipo` FK, `geom geometry(Point,4326)` |

Las tres relaciones son **1:N**: departamento–municipio, municipio–equipamiento y tipo–equipamiento.

## 2. Campos empleados por el backend

**`departamento`:** `cod_departamento`, `nombre` (definición y restricciones versionadas en `sql/01_crear_geodatabase.sql`).

**`municipio`:** `cod_municipio`, `nombre`, `cod_departamento`, `geom` (definición y restricciones versionadas en `sql/01_crear_geodatabase.sql`).

**`tipo_equipamiento`:** `id_tipo`, `nombre_tipo`; `descripcion` figura en el diseño conceptual anterior, pero no está probado en el repositorio que se haya implementado exactamente con ese nombre o tipo.

**`equipamiento`:** `id_equipamiento`, `nombre`, `cod_municipio`, `id_tipo`, `codigo_fuente`, `direccion`, `estado`, `fuente`, `geom` según el modelo adoptado y las consultas vigentes. Los SQL F4/F5 verifican el uso efectivo de `id_equipamiento`, `nombre`, `codigo_fuente`, `direccion`, `id_tipo`, `cod_municipio` y `geom`. No se puede reconstruir el DDL exacto de todos los campos a partir de estas consultas.

## 3. Relaciones y significado

- Una FK de `municipio.cod_departamento` a `departamento.cod_departamento` verifica existencia del departamento y su relación administrativa.
- `equipamiento.cod_municipio` referencia el municipio declarado; **no demuestra** que el punto esté dentro de su polígono.
- `equipamiento.id_tipo` identifica Educativo (1) o Salud (2).
- La ausencia de un valor nulo en un campo **no demuestra** disponibilidad o calidad del servicio de salud o educación.

## 4. Origen y cobertura de los datos

- **Municipios:** DANE/DIVIPOLA MGN 2025, 12 multipolígonos transformados a EPSG:4326.
- **Educativo:** DANE/SISE 2026, 418 sedes.
- **Salud:** SISPRO/REPS 2026, 227 sedes incorporadas de 228 registros candidatos; uno excluido por inconsistencia espacial-administrativa.
- **Total:** 645 equipamientos. El estado inicial de la base docente se considera «Sin verificar» hasta disponer de evidencia en campo.

Estas cifras son un corte de la instalación docente. No deben describirse como censo universal ni fuente dinámica actualizada automáticamente.

## 5. Consultas vinculadas

| Operación | Tablas consultadas | Mecanismo |
|---|---|---|
| F1 | `municipio` | `SELECT` y `ST_AsGeoJSON` |
| F2 | `municipio` | `ST_Area(geom::geography)/1000000` |
| F3 | `municipio` | `ST_Covers` |
| F4 | `equipamiento` | `id_tipo=2`, `ST_DWithin`, `ST_Distance` |
| F5 | `equipamiento` | `cod_municipio` e `id_tipo` |

**Observación:** el hecho de que F4/F5 no consulten explícitamente `tipo_equipamiento` ni `departamento` no hace innecesarias estas tablas: contribuyen a organizar e integrar los datos.

## 6. Unidades y referencia espacial

`geometry(...,4326)` almacena coordenadas geográficas en grados; no es válido interpretar distancias de geometría en grados como metros. El backend usa `geography` para F2 y F4. `ST_SetSRID` asigna SRID, mientras `ST_Transform` realiza transformaciones reales de coordenadas.

## 7. Auditoría estructural que falta

Los únicos scripts DDL versionados crean **las dos tablas originales**. Para publicar el modelo físico completo como reproducible, debemos extraer de la base docente las definiciones reales de las otras dos tablas, incluyendo claves, tipos, restricciones e índices. Un procedimiento de **solo lectura**:

```sql
SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('departamento','municipio','tipo_equipamiento','equipamiento')
ORDER BY table_name, ordinal_position;
```

Consultar también `pg_constraint` y `pg_indexes` para restricciones e índices. **No ejecutar** los scripts de creación originales sobre la instalación ya poblada.

La [Etapa 01](etapa-01-geodatabase.md) representa el primer estado histórico; la [ampliación del modelo](modelo-ampliado-cuatro-tablas.md) explica la evolución. Este documento es el resumen vigente, no una reproducción certificada del esquema DDL actual.
