# Decisión de diseño: modelo ampliado de cuatro tablas (opción A)

**Proyecto:** Programación SIG Web · **Curso:** Programación para SIG  
**Ámbito:** municipios del Quindío, Colombia  
**Decisión aceptada:** complementar el modelo administrativo con equipamientos y un catálogo temático, para enriquecer las consultas desde Leaflet.  
**Estado de implementación:** **aprobado a nivel de diseño; no implementado todavía en PostgreSQL**. Las tablas `departamento` y `municipio` ya existen y están pobladas; `tipo_equipamiento` y `equipamiento` aún deben crearse, cargarse y verificarse. No se altera ni descarta el endpoint actual `GET /municipios`.

## 1. Motivación y alcance curricular

Los estudiantes ya aprobaron Bases de Datos Geográficas. El propósito de ampliar el modelo **no es repetir un curso de diseño relacional**, sino disponer de datos espaciales y temáticos con suficiente expresividad para desarrollar consultas HTTP y espaciales desde un geovisor.

El modelo mínimo con `departamento` y `municipio` permite publicar límites administrativos. El modelo ampliado permite además seleccionar equipamientos por categoría, filtrarlos por municipio, contarlos, identificarlos dentro de polígonos y buscar puntos cercanos a una localización seleccionada.

**Criterio de calidad:** cuatro tablas se justifican por funcionalidades reales, no por el número de entidades del diagrama.

## 2. Entidades y relaciones

~~~mermaid
erDiagram
    DEPARTAMENTO ||--o{ MUNICIPIO : contiene
    MUNICIPIO ||--o{ EQUIPAMIENTO : registra
    TIPO_EQUIPAMIENTO ||--o{ EQUIPAMIENTO : clasifica

    DEPARTAMENTO {
        varchar_2 cod_departamento PK
        varchar_100 nombre
    }
    MUNICIPIO {
        varchar_5 cod_municipio PK
        varchar_100 nombre
        varchar_2 cod_departamento FK
        multipolygon_4326 geom
    }
    TIPO_EQUIPAMIENTO {
        smallint id_tipo PK
        varchar_80 nombre_tipo UK
        text descripcion
    }
    EQUIPAMIENTO {
        bigint id_equipamiento PK
        varchar_160 nombre
        varchar_5 cod_municipio FK
        smallint id_tipo FK
        point_4326 geom
        text direccion
        varchar_40 estado
        text fuente
    }
~~~

Las tres relaciones son **1:N**, interpretadas como *una instancia del lado 1 puede tener de cero a muchas instancias del lado N*:

1. **Departamento 1:N Municipio:** un municipio está adscrito a un departamento; en este ejercicio la tabla administrativa contiene Quindío.
2. **Municipio 1:N Equipamiento:** cada equipamiento registrado referencia exactamente un municipio, mientras un municipio puede no tener equipamientos en el conjunto de datos.
3. **TipoEquipamiento 1:N Equipamiento:** cada equipamiento se clasifica en un tipo, mientras un tipo puede estar temporalmente sin registros.

**Precisión conceptual:** la columna `geom` **no forma parte de la tabla `departamento` actualmente implementada**. Aunque una ampliación futura podría incorporar esa geometría, no es necesaria para los objetivos del ejercicio. Cualquier figura que muestre `departamento.geom` debe corregirse o etiquetarse explícitamente como ampliación no ejecutada.

## 3. Diseño lógico de referencia

| Tabla | Atributos esenciales | Geometría / observaciones |
|---|---|---|
| `departamento` (**ya existe**) | `cod_departamento` PK, `nombre` | Sin geometría en la implementación actual |
| `municipio` (**ya existe**) | `cod_municipio` PK, `nombre`, `cod_departamento` FK | `geom geometry(MultiPolygon,4326)`, 12 registros DANE 2025 |
| `tipo_equipamiento` (**por crear**) | `id_tipo` PK, `nombre_tipo` único, `descripcion` opcional | Tabla de catálogo, sin geometría |
| `equipamiento` (**por crear**) | `id_equipamiento` PK, `nombre`, `cod_municipio` FK, `id_tipo` FK, `geom`, `direccion` opcional, `estado` opcional, `fuente` recomendada | `geom geometry(Point,4326)` |

Ejemplos **provisionales** de tipos: salud, educación, cultura, deporte, seguridad. El catálogo definitivo debe ajustarse a las categorías y definiciones de la fuente seleccionada, evitando mezclar categorías no comparables.

Las claves primarias, foráneas, valores obligatorios, restricciones geométricas e índices GiST se definirán **después de validar la disponibilidad, licencia, localización y significado de los datos de equipamientos**. `estado` no debe incorporarse con valores arbitrarios sin un dominio definido. El campo `fuente` puede complementarse con identificador de origen y fecha de actualización si el conjunto de datos lo permite.

## 4. Dos dimensiones distintas de integridad

**Integridad referencial:** `equipamiento.cod_municipio` debe existir en `municipio.cod_municipio` y `equipamiento.id_tipo` debe existir en `tipo_equipamiento.id_tipo`.

**Coherencia espacial:** vincular un punto a un municipio mediante una clave foránea **no demuestra que el punto esté dentro de su geometría**. Debe hacerse una auditoría separada mediante el predicado espacial correspondiente, por ejemplo `ST_Covers(m.geom, e.geom)`. Los puntos situados en límites compartidos necesitan tratamiento explícito: pueden estar cubiertos por más de un polígono, aunque cada registro tenga un único código municipal administrativo.

No equiparar validación individual `ST_IsValid` con comprobación de consistencia espacial entre entidades; no evaluar distancias métricas directamente sobre coordenadas EPSG:4326 en grados.

## 5. Consultas que justifican la ampliación

| Pregunta del usuario | SQL / PostGIS que ilustra | Comportamiento cartográfico |
|---|---|---|
| ¿Cuántos equipamientos de salud hay en cada municipio? | `JOIN` + `GROUP BY` + filtro de tipo | Conteos asociados a municipios; incluye cero con `LEFT JOIN` |
| ¿Qué equipamientos de una categoría pertenecen a Salento? | `JOIN` entre municipio, equipamiento y tipo | Mostrar puntos de la categoría y el municipio |
| ¿Qué equipamientos se encuentran dentro del polígono seleccionado? | `ST_Covers(m.geom, e.geom)` | Consultar puntos contenidos; comparar con FK administrativa |
| ¿Qué equipamientos están a menos de 1 km de un clic? | `ST_DWithin(e.geom::geography, punto::geography, 1000)` | Resaltar puntos próximos; distancia en metros |
| ¿Cuál es el equipamiento más cercano de un tipo? | Ordenamiento por distancia geodésica, con filtros | Selección del más próximo y distancia reportada |

**Atención a los conteos:** el número de equipamientos registrados no es necesariamente el número real existente en el territorio. La interpretación depende de cobertura, vigencia y reglas de clasificación de la fuente.

## 6. Integración progresiva con FastAPI y Leaflet

Las cuatro funcionalidades **F1–F4 del plan original se conservan**: límites municipales, detalle municipal, identificación por punto y proximidad respecto a los polígonos municipales. La nueva tabla de equipamientos **agrega alcance**, no sustituye ni altera silenciosamente el significado de F3/F4.

Propuesta de endpoints **adicionales, aún no implementados**:

- `GET /tipos-equipamiento` — devuelve catálogo.
- `GET /equipamientos?cod_municipio=...&id_tipo=...` — puntos filtrados en GeoJSON, con parámetros opcionales validados.
- `GET /consultas/equipamientos-en-municipio?cod_municipio=...` — consulta espacial de puntos respecto del polígono, distinta del simple filtro por FK.
- `GET /consultas/equipamientos-cercanos?lon=...&lat=...&radio_m=...` — consulta de proximidad de **puntos** mediante `ST_DWithin` en metros.

Estas rutas son propuestas de contrato; se definirán sus respuestas, casos límite, manejo de cero resultados y pruebas antes de implementarlas.

## 7. Secuencia propuesta y dependencias

1. Mantener funcionando el backend mínimo y comprobar el primer consumo GeoJSON desde Leaflet (**F1**).
2. Elegir y auditar una fuente de equipamientos real, con coordenadas verificadas, licencia y fecha de actualización; si son simulados para enseñanza, etiquetarlos inequívocamente como sintéticos.
3. Cerrar la especificación física de las dos tablas nuevas y sus restricciones. No alterar las dos tablas existentes ni repetir la carga de los 12 municipios.
4. Crear `tipo_equipamiento` y `equipamiento` en una migración SQL nueva y versionada; poblar con datos comprobados.
5. Verificar claves foráneas, SRID, geometrías, localización punto-polígono y completitud temática, registrando excepciones.
6. Incorporar endpoints temáticos y espaciales adicionales; probar la cadena evento → HTTP → SQL/PostGIS → GeoJSON → Leaflet.

## 8. Decisión arquitectónica principal

**Aprobado:** ampliar de dos a cuatro tablas con tres relaciones 1:N, manteniendo el foco didáctico en programación de geovisores y consultas espaciales del lado del servidor.

**No ejecutado:** creación de las tablas de equipamientos, carga de registros, nuevas rutas API ni visualizaciones de puntos. Todo ello se verificará antes de presentarse como funcional.

**No cambiar retrospectivamente:** los scripts de las Etapas 01 y 02 documentan correctamente el modelo mínimo que ya fue construido y auditado. La ampliación debe incorporarse **mediante nuevos scripts y nuevas versiones**, nunca sobrescribiendo ese historial.
