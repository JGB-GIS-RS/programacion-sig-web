# Especificación funcional y pruebas del geovisor — F1 a F4

Las cuatro funcionalidades siguientes constituyen el **núcleo obligatorio** del ejercicio de Programación para SIG. Se ejecutarán en orden, sobre los límites municipales del Quindío cargados en PostgreSQL/PostGIS.

## Reglas comunes

- Fuente de datos: tabla `municipio` validada; identificador `cod_municipio`, nombre `nombre`, geometría `geom` y clave foránea `cod_departamento` a la tabla `departamento`. Modelo y scripts: [Etapa 01 — geodatabase](etapa-01-geodatabase.md).
- Supuesto inicial: `geom geometry(MultiPolygon,4326)`. Si se decide otro SRID, se actualizan de forma coherente las transformaciones y consultas.
- Entrada desde Leaflet: latitud y longitud del clic; hacia la API se usan parámetros **`lon` y `lat`**; al construir un punto SQL: **`ST_MakePoint(lon, lat)`**.
- Respuestas cartográficas: GeoJSON `FeatureCollection`, incluso con cero elementos. Geometría publicada en WGS 84 / EPSG:4326.
- Las consultas espaciales son **ejecutadas por PostGIS**, invocadas por FastAPI y visualizadas por Leaflet; no se reemplazan por cálculos locales.
- Manejar peticiones lentas, errores HTTP, geometrías faltantes y consultas con cero resultados sin bloquear el visor.
- Los ejemplos SQL son **referencia de diseño para el backend**, no consultas listas para pegar en pgAdmin: los marcadores `%(lon)s`, `%(lat)s` y `%(radio_m)s` representan parámetros vinculados mediante el controlador Python.

## F1. Visualizar los municipios del Quindío

**Objetivo:** que la representación del mapa proceda de datos consultados a PostGIS mediante la API, en lugar de cargar manualmente un GeoJSON estático en el frontend.

**Evento:** apertura del visor.

**Endpoint:** `GET /municipios`.

**Procesamiento previsto:**

1. Leaflet inicializa el mapa y hace `fetch()` de `/municipios`.
2. FastAPI ejecuta una consulta SQL a la tabla municipal.
3. El backend devuelve `FeatureCollection` con `cod_municipio`, `nombre` y `geometry`.
4. Leaflet dibuja `L.geoJSON(datos)` y encuadra la extensión de resultados.

**Ejemplo sintético de estructura GeoJSON** (geometría y atributos inventados únicamente para ilustrar el formato; **no corresponde a un municipio real**):

~~~json
{
  "type": "Feature",
  "properties": {
    "cod_municipio": "00000",
    "nombre": "Ejemplo sintético"
  },
  "geometry": {
    "type": "MultiPolygon",
    "coordinates": [
      [
        [
          [-75.7, 4.5],
          [-75.6, 4.5],
          [-75.6, 4.6],
          [-75.7, 4.6],
          [-75.7, 4.5]
        ]
      ]
    ]
  }
}
~~~

En la aplicación real **ninguna coordenada ni atributo se inventa**: se serializan los registros leídos desde PostGIS y se publican juntos en una `FeatureCollection`.

**Aceptación:** los polígonos visibles coinciden con los registros de PostGIS; el inspector de red muestra `GET /municipios` con HTTP 200 y GeoJSON válido; el número esperado es 12, sujeto a la auditoría de la fuente. Se muestran errores si la API no está disponible.

## F2. Seleccionar un municipio y consultar información adicional

**Objetivo:** enseñar explícitamente la diferencia entre interacción local y consulta parametrizada al servidor.

**Eventos:**
- Primer clic en un polígono: mostrar un popup **local** con nombre y código que ya fueron descargados con F1.
- Acción del usuario «Consultar detalle»: solicitar información **adicional** al backend.

**Endpoint de detalle:** `GET /municipios/{codigo}`; `codigo` es texto de cinco dígitos, preservando ceros iniciales.

**Respuesta JSON conceptual:**

~~~json
{
  "cod_municipio": "63001",
  "nombre": "Armenia",
  "area_geodesica_km2": 0.0
}
~~~

**Importante:** `0.0` es un valor de ejemplo de estructura, **no una estimación del área de Armenia**. El backend calcula el área real desde la geometría validada, mediante `ST_Area(geom::geography)/1000000.0`.

**Consulta SQL orientativa:**

~~~sql
SELECT
    cod_municipio,
    nombre,
    ST_Area(geom::geography) / 1000000.0 AS area_geodesica_km2
FROM municipio
WHERE cod_municipio = %(codigo)s;
~~~

**Aceptación:**
- El popup inicial se abre **sin una nueva petición HTTP**.
- Al solicitar detalle aparece una petición `GET /municipios/63001` (u otro código existente).
- El servidor consulta PostGIS y devuelve un dato **que no venía en F1**.
- Un código inexistente devuelve 404; no se confunde con falta de conectividad.
- La interfaz distingue el área calculada de cualquier superficie oficial.

## F3. Identificar municipios a partir de un punto seleccionado

**Objetivo:** convertir un clic espacial en una consulta geográfica ejecutada por PostGIS.

**Evento:** clic en el mapa fuera del control de selección de polígono, en modo «Identificar ubicación».

**Endpoint:**

~~~text
GET /consultas/ubicacion?lon=...&lat=...
~~~

**Secuencia:**

1. Leaflet obtiene `e.latlng.lng` y `e.latlng.lat`.
2. JavaScript llama al endpoint con coordenadas y gestiona el estado de carga.
3. FastAPI valida valores y crea el punto en EPSG:4326.
4. PostGIS determina qué municipios **cubren** ese punto.
5. La API devuelve una `FeatureCollection` (cero, uno o más municipios).
6. Leaflet destaca las coincidencias y muestra sus identificadores.

**Predicado recomendado:** `ST_Covers(geom, punto)`. Incluye puntos en el interior y sobre el límite del polígono.

**SQL orientativo:**

~~~sql
SELECT cod_municipio, nombre, ST_AsGeoJSON(geom)::json AS geometry
FROM municipio
WHERE ST_Covers(
    geom,
    ST_SetSRID(ST_MakePoint(%(lon)s, %(lat)s), 4326)
);
~~~

**Caso límite crucial:** un punto exactamente sobre una frontera compartida puede ser cubierto por **dos municipios**. El endpoint **no debe forzar una respuesta única** ni ocultar esa ambigüedad cartográfica. Un clic fuera del Quindío devuelve `features: []` con HTTP 200.

**Aceptación:** al hacer clic cambia el resultado visible; la petición incluye ambas coordenadas; el SQL utiliza `ST_Covers`; los casos dentro/fuera y, cuando sea posible, sobre un límite se prueban contra QGIS/pgAdmin.

## F4. Consulta espacial de proximidad por distancia

**Objetivo:** que el estudiante programe una búsqueda de entidades municipales próximas a un punto, con la distancia expresada en **metros** y la decisión espacial ejecutada en PostGIS.

**Eventos:** activar «Proximidad», elegir radio y hacer clic en el mapa (o actualizar el radio manteniendo el punto).

**Endpoint:**

~~~text
GET /consultas/proximidad?lon=...&lat=...&radio_m=5000
~~~

`5000` es únicamente un **ejemplo de parámetro**: equivale a un radio de 5 km, sin presuponer qué municipios devolverá la consulta.

**Lógica:**

1. Leer coordenadas y `radio_m` en el frontend.
2. Validar en FastAPI `radio_m >= 0` y un máximo razonable de laboratorio (propuesto: 50 000 m).
3. PostGIS evalúa `ST_DWithin()` sobre `geography` para que la distancia se interprete en metros.
4. Devolver polígonos municipales en GeoJSON.
5. Resaltar municipios coincidentes, actualizar contador y comunicar ausencia de resultados.

**SQL orientativo, con entrada y geometrías en EPSG:4326:**

~~~sql
SELECT cod_municipio, nombre, ST_AsGeoJSON(geom)::json AS geometry
FROM municipio
WHERE ST_DWithin(
    geom::geography,
    ST_SetSRID(ST_MakePoint(%(lon)s, %(lat)s), 4326)::geography,
    %(radio_m)s
);
~~~

**Interpretación:** la distancia se calcula respecto a **cualquier punto de la geometría municipal**, no respecto a su centroide ni cabecera. Si el punto está en el interior del municipio, la distancia a ese polígono es cero.

Puede representarse un círculo en Leaflet como guía gráfica del radio, aclarando que la determinación de coincidencias procede de PostGIS y que las geometrías dibujadas por el frontend no sustituyen el análisis del servidor.

**Aceptación:** modificar `radio_m` puede cambiar el resultado; los resultados se verifican con SQL independiente; valores negativos, texto no numérico y distancias fuera del límite se rechazan; se muestran estados de carga y cero coincidencias.

## Matriz de comprobación

| Caso | Cómo provocarlo | Evidencia requerida |
|---|---|---|
| F1 — carga correcta | Abrir visor con API disponible | Network: `GET /municipios`; 200; GeoJSON y polígonos |
| F1 — backend inactivo | Detener el backend y recargar | Error visible, sin afirmar que se cargaron datos |
| F2 — popup local | Clic en un municipio | Popup; **no aparece** una petición de detalle |
| F2 — detalle remoto | Solicitar detalle explícitamente | Network: `GET /municipios/{codigo}`; valor adicional calculado en PostGIS |
| F2 — código inexistente | Invocar código de cinco dígitos sin registro | 404 controlado |
| F3 — punto interior | Clic dentro de un municipio | Coincidencia contrastada con `ST_Covers` |
| F3 — punto exterior | Clic fuera del territorio | 200 + `features: []` |
| F3 — límite compartido | Usar punto de límite validado | 0/1/N según la fuente; **no imponer unicidad** |
| F4 — radio 0 | Punto sobre o dentro de un municipio | Resultado coherente con distancia cero |
| F4 — varios radios | Mismo punto con radios crecientes | Conjuntos de resultados no decrecientes, con geometrías sin cambios |
| F4 — radio inválido | `radio_m=-10` o superior al máximo | Error de validación, no consulta silenciosa |
| Todas — coordenadas inválidas | Latitud fuera de [-90, 90] | HTTP 422, sin ejecutar SQL |
| Todas — trazabilidad | Repetir consulta desde visor y pgAdmin | Concordancia entre predicado PostGIS y resultado publicado |

La prueba de monotonía en F4 debe usar el **mismo punto y la misma versión de la capa**; si se incrementa el radio, un municipio antes seleccionado no debe desaparecer.

## Contrato final que debe observarse en el navegador

- F1: **servidor → visor**, publicación.
- F2: **interacción local** y después **visor → servidor → visor**, detalle.
- F3: **visor → predicado espacial PostGIS → visor**, identificación.
- F4: **visor → consulta métrica PostGIS → visor**, proximidad.

### Evidencia final por estudiante

Demostrar en vivo el evento, los parámetros enviados, la petición HTTP, la respuesta, la consulta SQL que la produjo y el estado cartográfico resultante. Presentar al menos un caso de éxito y un caso límite de F3/F4.

**Estado del repositorio:** especificación funcional aprobada para desarrollar progresivamente; **ninguna de estas funcionalidades se considera implementada hasta contar con código y pruebas reproducibles**.
