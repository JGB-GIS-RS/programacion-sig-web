# Arquitectura técnica y responsabilidades

## 1. Propósito y conocimientos previos

La asignatura **Programación para SIG** retoma conocimientos previos sobre bases de datos geográficas. El nuevo problema es de **integración y programación de una aplicación web geoespacial**: transformar interacciones de un usuario en operaciones SQL/espaciales sobre PostGIS y publicar resultados en Leaflet.

La arquitectura comprende tres componentes separados: frontend, backend y base de datos. GeoJSON no es un cuarto componente: es un **formato de intercambio**.

## 2. Arquitectura de referencia

~~~mermaid
flowchart TB
    U["USUARIO<br/>Selecciona municipio · clic · indica radio"]
    L["FRONTEND<br/>HTML + CSS + JavaScript + Leaflet<br/>Eventos, solicitudes y representación"]
    A["BACKEND<br/>Python + FastAPI<br/>Validación, API y transformación de respuestas"]
    D[("PostgreSQL + PostGIS<br/>Atributos, geometrías y análisis espacial")]
    U -->|"Interacción"| L
    L -->|"HTTP GET + parámetros"| A
    A -->|"SQL parametrizado"| D
    D -->|"Resultado espacial"| A
    A -->|"HTTP + JSON o GeoJSON"| L
    L -->|"Mapa actualizado"| U
~~~

### Responsabilidades inequívocas

| Componente | Debe hacer | No le corresponde |
|---|---|---|
| Navegador, JavaScript y Leaflet | Inicializar mapa, controlar eventos, recopilar coordenadas, construir solicitudes `fetch()`, representar GeoJSON, distinguir estados de carga/error y resultados | Conocer claves de la base de datos o establecer una sesión PostgreSQL directa |
| API FastAPI | Exponer rutas HTTP, validar parámetros, gestionar conexión a PostGIS, usar SQL parametrizado, devolver JSON/GeoJSON y códigos de estado | Simular una consulta espacial con datos inventados |
| PostgreSQL/PostGIS | Almacenar el dato geográfico, filtrar, ejecutar `ST_Covers()`, `ST_DWithin()` y funciones de geometría, devolver registros | Representar el mapa en el navegador |
| QGIS/pgAdmin (herramientas de preparación) | Cargar, inspeccionar y auditar datos; probar SQL | Formar parte del recorrido de una consulta web en producción |

**Regla:** una consulta al servidor debe ser visible en la pestaña *Network/Red* del navegador y comprobable en el código del endpoint y en SQL. Un popup local no prueba una consulta a PostGIS.

## 3. Dos recorridos y un contraste

### 3.1. Publicación inicial de municipios (F1)

~~~mermaid
sequenceDiagram
    actor U as Usuario
    participant L as Leaflet/JavaScript
    participant A as FastAPI
    participant D as PostGIS
    U->>L: Abre el geovisor
    L->>A: GET /municipios
    A->>D: SELECT atributos mínimos, geometría
    D-->>A: 12 registros esperados
    A-->>L: 200 + GeoJSON FeatureCollection
    L-->>U: Dibuja polígonos y eventos
~~~

La cifra **12** presupone un insumo completo y validado para el departamento del Quindío; debe comprobarse en la carga, no sustituirse por datos ficticios.

### 3.2. Interacción local frente a consulta al servidor (F2)

~~~mermaid
sequenceDiagram
    actor U as Usuario
    participant L as Leaflet/JavaScript
    participant A as FastAPI
    participant D as PostGIS
    U->>L: Clic sobre un polígono
    L-->>U: Popup local con nombre y código ya cargados
    Note over L: No hay nueva petición HTTP
    U->>L: Solicita "Consultar detalle"
    L->>A: GET /municipios/{codigo}
    A->>D: SELECT campos adicionales / cálculo de área
    D-->>A: Detalle del municipio
    A-->>L: 200 + JSON
    L-->>U: Actualiza panel de detalle
~~~

**Requisito de diseño:** `GET /municipios` devuelve solo atributos básicos. `GET /municipios/{codigo}` entrega información adicional, por ejemplo superficie geométrica calculada. Esto permite demostrar una solicitud al servidor real, en lugar de pedir de nuevo la misma información ya almacenada en el navegador.

### 3.3. Consulta espacial originada en el mapa (F3 y F4)

~~~mermaid
sequenceDiagram
    actor U as Usuario
    participant L as Leaflet/JavaScript
    participant A as FastAPI
    participant D as PostGIS
    U->>L: Clic: (latitud, longitud)
    L->>A: GET /consultas/... ?lon=...&lat=... [&radio_m=...]
    A->>A: Valida coordenadas y distancia
    A->>D: SQL parametrizado + predicado espacial
    D-->>A: 0, 1 o N municipios
    A-->>L: 200 + GeoJSON FeatureCollection
    L-->>U: Resalta polígonos y comunica el resultado
~~~

## 4. Contrato de intercambio

- `GET /municipios`: respuesta GeoJSON de tipo `FeatureCollection`, geometrías `MultiPolygon` y propiedades mínimas `cod_municipio` y `nombre`.
- `GET /municipios/{codigo}`: respuesta JSON con `cod_municipio`, `nombre` y `area_geodesica_km2` calculada a partir de `geom::geography` (no es necesariamente el área oficial).
- `GET /consultas/ubicacion` y `GET /consultas/proximidad`: `FeatureCollection` también cuando no hay coincidencias; en ese caso `features: []`.
- Errores de parámetros: HTTP 422 según validación FastAPI; código inexistente: 404; fallos del servidor: códigos 5xx, con mensajes controlados (sin divulgar contraseñas ni SQL interno).
- `Content-Type` apropiado: `application/geo+json` para GeoJSON o `application/json` cuando corresponda.
- La respuesta debe ser JSON serializable y el frontend debe distinguir éxito, ausencia de resultados y error de red.

GeoJSON se representa en **WGS 84 (EPSG:4326)** y sus posiciones usan **[longitud, latitud]**. La API debe transformar a EPSG:4326 si la geometría se almacena en otro CRS. Leaflet entrega típicamente el evento como `e.latlng.lat` y `e.latlng.lng`: **no invertir** los parámetros al generar `ST_MakePoint(lon, lat)`.

## 5. Referencia espacial y mediciones

Para el prototipo se propone normalizar la columna `municipio.geom` como `geometry(MultiPolygon,4326)`. No se da por supuesto el CRS original: se inspecciona y transforma correctamente durante la carga.

- `ST_SetSRID()` **etiqueta** coordenadas; no las transforma.
- `ST_Transform()` **transforma** coordenadas cuando los CRS de origen y destino están correctamente definidos.
- `ST_DWithin(geometry, geometry, distancia)` interpreta la distancia en unidades del sistema de coordenadas; en EPSG:4326 esas unidades son grados, **no metros**.
- Para F4 se propone `ST_DWithin(geom::geography, punto::geography, radio_m)`, que opera en metros, o una alternativa proyectada documentada.
- El área derivada puede calcularse mediante `ST_Area(geom::geography)/1000000.0`, documentando que es área calculada, distinta de un valor oficial publicado.
- Un círculo dibujado en Leaflet puede servir de **referencia visual** del radio; no debe presentarse como prueba de cómo evaluó PostGIS la distancia geodésica.

## 6. Seguridad y manejo de parámetros

1. **Credenciales:** no incluir contraseña ni cadena de conexión con credenciales en `app.js`, archivos públicos o repositorio. Configurar secretos en el entorno del backend.
2. **Parámetros SQL:** jamás interpolar directamente texto recibido de la URL en la consulta; usar parámetros enlazados por el controlador PostgreSQL de Python.
3. **Validación:** `lon` entre -180 y 180; `lat` entre -90 y 90; `radio_m` numérico, no negativo y sujeto a un máximo definido por la práctica (propuesto: 50 000 m). Deben rechazarse NaN e infinitos.
4. **CORS:** configurar explícitamente el origen local del frontend si se usan puertos distintos (por ejemplo, Live Server y FastAPI); evitar habilitar indiscriminadamente cualquier origen fuera del laboratorio.
5. **Consulta de solo lectura:** los endpoints de esta primera versión son `GET` y no modifican datos de PostGIS.
6. **Interfaz:** mostrar estado de carga, cero coincidencias y mensajes de error. Evitar que una respuesta tardía sobrescriba silenciosamente una consulta posterior.

## 7. Evidencia mínima de funcionamiento

No basta con que el mapa «se vea bien». Para cada consulta remota:

1. Abrir herramientas de desarrollador, pestaña **Network/Red**.
2. Provocar el evento de Leaflet y localizar la petición con parámetros explícitos.
3. Comprobar el estado HTTP y el cuerpo JSON/GeoJSON.
4. Verificar que el endpoint realmente ejecuta SQL sobre PostGIS.
5. Contrastar una muestra de resultados con la misma consulta en pgAdmin o QGIS.
6. Confirmar el cambio visible en Leaflet: geometrías resaltadas, detalle actualizado o mensaje sin resultados.

Una interacción que solo opera sobre objetos previamente cargados también es válida, **siempre que se identifique expresamente como interacción local**.

## 8. Decisiones diferidas

La implementación inicial está sustentada por las **dos tablas ya creadas**: `departamento` (alfanumérica) y `municipio` (geográfica) con relación 1:N. Sus columnas y restricciones constan en [Etapa 01 — diseño físico](etapa-01-geodatabase.md). Como **ampliación de diseño aprobada, todavía no ejecutada**, incorporaremos `tipo_equipamiento` y `equipamiento` con dos relaciones 1:N adicionales; véase [modelo ampliado de cuatro tablas](modelo-ampliado-cuatro-tablas.md). Esta ampliación habilitará consultas temáticas y de puntos sin invalidar los endpoints o scripts del modelo inicial.

La implementación real de `backend/main.py`, `frontend/index.html`, `frontend/style.css` y `frontend/app.js` será progresiva. Este documento especifica **cómo debe comportarse la aplicación**, pero no afirma que exista una implementación funcional.
