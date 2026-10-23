# Programación SIG Web

**Proyecto docente de Programación para SIG — Ingeniería Topográfica y Geomática**

Ejercicio progresivo para **programar un geovisor que consulte y analice información almacenada en PostgreSQL/PostGIS**, mediante una API en Python/FastAPI y una interfaz desarrollada con HTML, CSS, JavaScript y Leaflet.

**Territorio de estudio:** los 12 municipios del departamento del Quindío, Colombia.

> **Punto de partida curricular.** Los estudiantes ya cursaron Bases de Datos Geográficas. En este ejercicio se recuperan únicamente los conceptos necesarios de esquema, geometría, identificadores, SRID e integridad. **No se repite el diseño conceptual, lógico y físico como unidad temática**: el énfasis está en la comunicación entre componentes, la programación de consultas y la respuesta interactiva del geovisor.

## Objetivo general

Desarrollar una aplicación SIG web que permita visualizar y consultar información geoespacial almacenada en PostgreSQL/PostGIS mediante una API con FastAPI y un geovisor interactivo con Leaflet, incorporando **consultas espaciales ejecutadas en el servidor a partir de interacciones del usuario**.

El estudiante debe poder explicar y demostrar dos recorridos:

- **Publicación:** PostGIS → SQL → FastAPI → HTTP/GeoJSON → JavaScript/Leaflet → mapa.
- **Consulta interactiva:** usuario → evento Leaflet → petición HTTP → FastAPI → SQL/PostGIS → respuesta → actualización del mapa.

## Arquitectura

~~~mermaid
flowchart TB
    U["USUARIO<br/>Selecciona un municipio, hace clic o define una distancia"]
    L["FRONTEND<br/>HTML + CSS + JavaScript + Leaflet<br/>Captura eventos, realiza peticiones y representa resultados"]
    F["BACKEND<br/>Python + FastAPI<br/>Valida parámetros, ejecuta consultas y construye respuestas"]
    D[("BASE DE DATOS ESPACIAL<br/>PostgreSQL + PostGIS<br/>Almacena geometrías y ejecuta operaciones espaciales")]
    U -->|"Interacción"| L
    L -->|"HTTP: parámetros de consulta"| F
    F -->|"SQL parametrizado"| D
    D -->|"Registros y resultados espaciales"| F
    F -->|"HTTP: JSON o GeoJSON"| L
    L -->|"Mapa, selección y resultados"| U
~~~

**Regla arquitectónica:** Leaflet **no se conecta directamente** a PostgreSQL. El navegador se comunica con FastAPI, y FastAPI accede a PostGIS. Las credenciales de la base de datos permanecen en el servidor.

Véanse los flujos completos, la distribución de responsabilidades y los criterios técnicos en [Arquitectura](docs/arquitectura.md).

## Modelo ampliado aprobado: cuatro tablas

El modelo inicial de dos tablas ya está implementado y validado. Para enriquecer las consultas espaciales y temáticas del geovisor se ha **aprobado la opción A**, con cuatro tablas y tres relaciones 1:N:

- `departamento` **1:N** `municipio` (existentes).
- `municipio` **1:N** `equipamiento` (la tabla de puntos está pendiente de implementar).
- `tipo_equipamiento` **1:N** `equipamiento` (catálogo y clasificación pendientes de implementar).

**[Diseño conceptual y lógico, criterios de integridad y ruta de ampliación](docs/modelo-ampliado-cuatro-tablas.md)**. La ampliación no modifica por ahora las tablas existentes ni el endpoint local `GET /municipios`; su implementación se planificará después de acordar una fuente de equipamientos trazable.

## Etapa 04 — F1: geovisor Leaflet (código preparado)

Se añadieron los archivos [`frontend/index.html`](frontend/index.html), [`frontend/style.css`](frontend/style.css) y [`frontend/app.js`](frontend/app.js). Consultan el endpoint local `GET /municipios`, dibujan los polígonos mediante `L.geoJSON()` y ajustan el encuadre. **La integración visual todavía debe validarse en el equipo docente**; no se considera F1 finalizada.

[Guía de integración con el backend Python local](docs/etapa-04-f1-leaflet.md). El archivo `backend/main.py` sigue siendo local; no se ha publicado código con credenciales.

## Cuatro funcionalidades del geovisor

| ID | Funcionalidad | Interacción | Resultado esperado |
|---|---|---|---|
| F1 | **Visualización de municipios** | Abrir el visor | Solicitar `GET /municipios`, recibir GeoJSON y dibujar los polígonos en Leaflet. |
| F2 | **Selección y consulta de un municipio** | Seleccionar un polígono; solicitar detalle | Distinguir popup **local** de petición `GET /municipios/{codigo}` al servidor, con información adicional. |
| F3 | **Identificación espacial por punto** | Clic en el mapa | Enviar coordenadas; resolver en PostGIS qué municipios **cubren** el punto; destacar resultados. |
| F4 | **Consulta de proximidad** | Clic + distancia en metros | Ejecutar `ST_DWithin()` en PostGIS; devolver y visualizar municipios a una distancia ≤ radio del punto. |

Estas funcionalidades son **requisitos del ejercicio**, no extensiones opcionales. Su especificación incluye solicitudes, respuestas, casos límite y criterios de aceptación: [Funcionalidades y pruebas](docs/funcionalidades.md).

### La distinción técnica decisiva

Un popup de Leaflet que muestra atributos ya descargados **no constituye una nueva consulta a la base de datos**. Para acreditar una consulta al servidor debe verificarse el flujo completo: evento → solicitud HTTP → endpoint → SQL/PostGIS → respuesta → cambio visible en el visor.

De igual forma, una operación espacial realizada exclusivamente en JavaScript **no demuestra una consulta espacial en PostGIS**. En F3 y F4, el predicado espacial se ejecuta en la base de datos.

## Ruta de implementación

| Etapa | Trabajo principal | Evidencia |
|---|---|---|
| 01 | Preparar la capa oficial de municipios y verificar PostGIS | Datos geográficos consultables; CRS y fuente documentados |
| 02 | Conectar Python/FastAPI con PostGIS | Endpoint y consulta SQL verificables |
| 03 | Publicar geometrías mediante HTTP/GeoJSON | `GET /municipios` entrega una `FeatureCollection` válida |
| 04 | Consumir la API desde Leaflet | Los municipios se dibujan a partir de `fetch()` |
| 05 | Programar selección local y consulta de detalle | Se comprueba cuándo existe o no una nueva petición HTTP |
| 06 | Identificar municipios a partir de coordenadas | Consulta por punto ejecutada en PostGIS |
| 07 | Incorporar consulta espacial por distancia | `ST_DWithin()` y visualización de resultados desde el mapa |

La preparación de PostGIS **no es el resultado final**; es la condición de partida para programar el visor. Revisión del dato, secuencia de trabajo, controles y entregables: [Hoja de ruta](docs/hoja-de-ruta.md).

## Etapa 01 · Geodatabase diseñada e implementada en PostGIS

Hemos decidido **construir las tablas antes de cargar la cartografía**: la base de datos espacial no será una simple importación automática de una capa del DANE. La recuperación conceptual es breve porque el alumnado ya aprobó Bases de Datos Geográficas; el trabajo principal del curso sigue siendo la conexión con el geovisor.

El diseño físico inicial consta de:

- **`public.departamento`**: `cod_departamento` (PK, texto de 2 dígitos) y `nombre`.
- **`public.municipio`**: `cod_municipio` (PK, texto de 5 dígitos), `nombre`, `cod_departamento` (FK a `departamento`) y `geom geometry(MultiPolygon,4326)`.
- Restricciones sobre códigos, relación departamental, geometrías válidas/no vacías e índice espacial **GiST** sobre `geom`.
- Un registro inicial para **Quindío (`63`)** y, antes de cargar la fuente oficial, **cero municipios**.

**Guía completa y SQL reproducible:** [Etapa 01 — diseño físico e implementación](docs/etapa-01-geodatabase.md) · [Script de creación](sql/01_crear_geodatabase.sql) · [Script de verificación](sql/02_verificar_geodatabase.sql).

En la **Etapa 02**, ya se incorporaron y auditaron los 12 registros en el equipo docente (véase abajo). EPSG:4326 es una convención del prototipo para intercambiar GeoJSON, no una unidad métrica para cálculos de distancia. El área se calculará en PostGIS cuando se solicite; no se almacena obligatoriamente como campo redundante.

**Precauciones geodésicas:** GeoJSON se publica en coordenadas WGS 84, longitud/latitud; las distancias en metros no se calculan directamente sobre grados. Para F4 se propone `geography` en PostGIS o una transformación proyectada apropiada. No confundir `ST_SetSRID()` con `ST_Transform()`.


## Etapa 02 · Poblamiento y auditoría completados (20-10-2026)

A partir de la fuente oficial **DANE DIVIPOLA MGN 2025**, se filtraron los **12 municipios del Quindío**, se exportaron desde QGIS a GeoPackage con transformación **EPSG:3857 → EPSG:4326**, y se importaron primero a `public.municipios_quindio_2025_stg`.

Se realizó una transferencia controlada a nuestra propia tabla `public.municipio`: PostgreSQL informó **`INSERT 0 12`**. La auditoría final mostró **12** en cada indicador (registros, códigos únicos, municipio del Quindío, SRID 4326, MultiPolygon y validez geométrica). Un `INNER JOIN` con `public.departamento` recuperó **12 filas**.

**Documentación y SQL:** [Etapa 02 — carga y validación](docs/etapa-02-carga-municipios.md) · [Auditar staging](sql/03_auditar_staging.sql) · [Transferencia reproducible](sql/04_cargar_municipios.sql) · [Validación final](sql/05_verificar_carga.sql).

> **Estado de la evidencia:** resultados observados en pgAdmin/QGIS durante la práctica local; la base de datos y el GeoPackage no están alojados en este repositorio. La auditoría de topología entre municipios sigue pendiente. **No volver a ejecutar el INSERT sobre la tabla docente ya poblada.**

## Contrato previsto de la API

| Método y ruta | Función | Tipo de respuesta |
|---|---|---|
| `GET /municipios` | Colección cartográfica con atributos mínimos | GeoJSON `FeatureCollection` |
| `GET /municipios/{codigo}` | Detalle adicional de un municipio | JSON |
| `GET /consultas/ubicacion?lon=...&lat=...` | Municipios que cubren el punto | GeoJSON `FeatureCollection` |
| `GET /consultas/proximidad?lon=...&lat=...&radio_m=...` | Municipios próximos al punto | GeoJSON `FeatureCollection` |

**Estos endpoints son un contrato de diseño; todavía no están implementados.** En los límites compartidos, la consulta de ubicación puede devolver más de un municipio; fuera del área de estudio, ninguno. La especificación de parámetros, unidades, estados y pruebas está en [Funcionalidades y pruebas](docs/funcionalidades.md).

## Documentación

- [docs/etapa-04-f1-leaflet.md](docs/etapa-04-f1-leaflet.md) — frontend de F1, integración y criterios de aceptación.

- [docs/etapa-01-geodatabase.md](docs/etapa-01-geodatabase.md) — modelo físico y creación de la geodatabase.
- [docs/etapa-02-carga-municipios.md](docs/etapa-02-carga-municipios.md) — **carga real y auditoría observada**, correspondencia de campos y resultados SQL.
- [sql/](sql/) — scripts SQL de **creación, auditoría staging, inserción controlada y verificación**.
- [docs/modelo-ampliado-cuatro-tablas.md](docs/modelo-ampliado-cuatro-tablas.md) — **opción A aprobada:** modelo de equipamientos, relaciones, integridad y consultas ampliadas (pendiente de implementación).
- [docs/arquitectura.md](docs/arquitectura.md) — responsabilidades, flujos de petición/respuesta, decisiones de seguridad, GeoJSON y CRS.
- [docs/funcionalidades.md](docs/funcionalidades.md) — **F1–F4**, endpoints, lógica espacial, eventos, casos límite y criterios de aceptación.
- [docs/hoja-de-ruta.md](docs/hoja-de-ruta.md) — prerrequisitos, preparación de datos del Quindío, progresión docente y evidencias de comprobación.

## Organización prevista del código

~~~text
programacion-sig-web/
├── README.md
├── docs/                    # Documentación de diseño y etapas (existente)
├── sql/                     # Creación y comprobación de la geodatabase (existente)
├── datos/                   # Insumos y su procedencia (por incorporar)
├── backend/
│   └── main.py              # API FastAPI (por implementar)
└── frontend/
    ├── index.html           # Interfaz (por implementar)
    ├── style.css            # Presentación (por implementar)
    └── app.js               # Leaflet, fetch y eventos (por implementar)
~~~

La estructura del frontend/backend es **proyectada** y se materializará por etapas. No se presentan ejemplos de arquitectura como código ya ejecutable.

## Criterio de logro

El ejercicio culmina cuando el estudiante demuestra, con el geovisor abierto y el inspector de red del navegador, que una interacción genera parámetros, **PostGIS ejecuta la consulta espacial**, FastAPI publica la respuesta y Leaflet la visualiza correctamente. Es tan importante la explicación del recorrido como el resultado cartográfico.

**Pregunta transversal:** ¿cómo llega una geometría almacenada en PostGIS al visor y cómo regresa al servidor una consulta originada en el mapa?
