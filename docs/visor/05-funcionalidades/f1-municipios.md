# F1 · Visualizar los municipios del Quindío

[← Menú F1–F5](index.md) · [Siguiente: F2 →](../../etapa-05-f2-detalle-municipal.md)

**Pregunta central:** ¿cómo llega a Leaflet la geometría de los 12 municipios almacenados en PostgreSQL/PostGIS?

**Al finalizar podrás:** seguir una solicitud desde el navegador hasta PostGIS, interpretar la respuesta GeoJSON y comprobar que los municipios representados proceden de la base de datos. **Ruta:** navegador → HTTP → FastAPI/Psycopg → PostGIS → GeoJSON → Leaflet. Esta lección explica el código vigente de [`backend/main.py`](../../../backend/main.py) y [`frontend/app.js`](../../../frontend/app.js), sin crear otra versión de la aplicación.

## 1. Problema geográfico

El mapa necesita los límites municipales y sus atributos. Sin embargo, **las geometrías no están dibujadas ni copiadas manualmente en JavaScript**: residen en la tabla `public.municipio` de nuestra geodatabase. F1 los consulta y los representa.

En la instalación docente se cargaron **12 municipios del Quindío**. Ese número es una condición de los datos utilizados en el ejercicio, no una propiedad inherente a FastAPI ni a Leaflet.

## 2. ¿Qué hace el usuario?

Abre el visor. F1 **se ejecuta automáticamente al cargar la página**, sin exigir que el usuario pulse un botón. El navegador ya puede mostrar las teselas OpenStreetMap, pero la capa de polígonos necesita una solicitud independiente a la API.

En [`frontend/app.js`](../../../frontend/app.js), el mapa se inicializa mediante `L.map("mapa")` y una capa `L.tileLayer(...)`. Las teselas de OpenStreetMap son **cartografía de fondo**; no proceden de PostGIS. La información municipal llega después.

## 3. JavaScript: pedir los municipios

La función vigente se llama `cargarMunicipios()`. Su petición principal es:

```javascript
const respuesta = await fetch("/municipios", {
  headers: { Accept: "application/geo+json" }
});
if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
const datos = await respuesta.json();
```

**Qué ocurre:** `fetch()` envía la petición; `Accept` declara el formato preferido; `respuesta.ok` permite identificar respuestas HTTP fallidas; y `respuesta.json()` interpreta el cuerpo recibido. **Interpretar JSON no garantiza que tenga la estructura GeoJSON esperada**: el código comprueba después que existe una `FeatureCollection` con un arreglo `features` no vacío.

Aquí **JavaScript no consulta directamente PostgreSQL**: únicamente se comunica mediante HTTP con FastAPI. La ruta `/municipios` se resuelve contra el origen desde el que se abrió la página; por eso funciona aquí, donde FastAPI sirve también el HTML (`http://127.0.0.1:8000/` en el ejercicio local).

## 4. FastAPI: recibir la petición

En [`backend/main.py`](../../../backend/main.py) encontramos:

```python
@app.get("/municipios")
def obtener_municipios():
```

El decorador asocia las solicitudes HTTP **GET** a `/municipios` con la función `obtener_municipios()`. Esta ruta no recibe filtros ni coordenadas. La función abre una conexión mediante `conectar_bd()` y ejecuta SQL con Psycopg.

**Tres responsabilidades:** FastAPI recibe la solicitud HTTP; Psycopg ejecuta SQL desde Python; y PostGIS proporciona los tipos y funciones geoespaciales de PostgreSQL. Ninguno de estos componentes reemplaza a los otros.

## 5. SQL y PostGIS: recuperar las geometrías

Esta es la consulta SQL del backend vigente. Léela de abajo hacia arriba: **tabla de origen → columnas seleccionadas → orden de resultados**:

```sql
SELECT
    cod_municipio,
    nombre,
    ST_AsGeoJSON(geom) AS geometria
FROM public.municipio
ORDER BY cod_municipio;
```

- `FROM public.municipio`: obtiene registros de nuestra tabla, no de un archivo GeoJSON estático.
- `cod_municipio`: código municipal DIVIPOLA, preservado como texto.
- `nombre`: nombre municipal almacenado.
- `ST_AsGeoJSON(geom)`: convierte **cada geometría** PostGIS en una representación textual GeoJSON.
- `ORDER BY cod_municipio`: establece un orden reproducible para las filas devueltas.

No aparece `ST_Intersects` ni `ST_Covers` porque F1 **no filtra espacialmente**. Recupera las geometrías de todos los municipios presentes en la tabla.

El código ejecuta `cursor.execute(sql)` y lee las filas mediante `cursor.fetchall()`. En esta ruta no hay parámetros del usuario.

## 6. ¿Qué devuelve FastAPI?

`ST_AsGeoJSON(geom)` produce el texto de la **geometría individual**; no construye por sí solo toda la `FeatureCollection`. Python interpreta esa geometría con `json.loads(geometria)`, crea una `Feature` con sus propiedades y finalmente agrupa las entidades:

```python
geojson = {
    "type": "FeatureCollection",
    "features": entidades
}
return JSONResponse(
    content=geojson,
    media_type="application/geo+json"
)
```

### Estructura de una entidad GeoJSON

Para evitar presentar un multipolígono vacío como si fuera válido, observa la organización de **una entidad simplificada**. Las coordenadas siguientes representan un polígono ficticio cerrado; **no son límites ni coordenadas reales del Quindío**:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "cod_municipio": "EJEMPLO",
        "nombre": "Municipio ficticio"
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [[[[-75.7, 4.5], [-75.6, 4.5], [-75.6, 4.6], [-75.7, 4.6], [-75.7, 4.5]]]]
        ]
      }
    }
  ]
}
```

En el visor real, las propiedades llevan códigos DIVIPOLA auténticos y cada `MultiPolygon` representa los límites almacenados en PostGIS. El ejemplo solo sirve para distinguir **colección, entidad, atributos y geometría**.

GeoJSON combina **geometría** y **atributos**. En este proyecto, las geometrías se almacenan con SRID 4326; al serializarlas como GeoJSON, las posiciones se expresan como `[longitud, latitud]`; Leaflet, al crear marcadores con coordenadas escritas directamente, utiliza normalmente `[latitud, longitud]`. No intercambiar esos órdenes.

## 7. Leaflet: representar la respuesta

La función `cargarMunicipios()` comprueba que recibe una colección no vacía y después crea la capa:

```javascript
municipios = L.geoJSON(datos, {
  style: estilo,
  onEachFeature: prepararMunicipio
}).addTo(mapa);

const limites = municipios.getBounds();
mapa.fitBounds(limites, { padding: [20, 20] });
```

- `L.geoJSON(datos)` convierte las entidades de la respuesta en capas Leaflet.
- `style` establece la simbología de los polígonos.
- `onEachFeature` prepara los popups y eventos de cada municipio.
- `getBounds()` calcula la extensión conjunta y `fitBounds()` ajusta la vista a ella.

**Distinción esencial entre F1 y F2:** el popup inicial de un municipio utiliza el nombre y el código **ya descargados en F1**. Ese clic no provoca otra consulta SQL. Solo el botón **«Consultar detalle»**, incorporado como parte de F2, genera una petición adicional para calcular la superficie.

El código también actualiza el contador y prepara el selector municipal que se reutiliza posteriormente en F5. Esta reutilización no convierte F5 en parte de la consulta F1.

## 8. Comprobar F1 por tres vías

### A. Desde la API

Con FastAPI y la base configurados, abre:

```text
http://127.0.0.1:8000/municipios
```

Comprueba que la respuesta tiene `type: "FeatureCollection"`, un arreglo `features` y, en el conjunto docente, **12 elementos**.

### B. Desde el navegador

1. Abre `http://127.0.0.1:8000/` y las herramientas de desarrollador (F12 → Network).
2. Recarga la página y localiza `GET /municipios`.
3. Verifica **HTTP 200** y revisa el GeoJSON recibido.
4. Observa que los polígonos aparecen en el mapa, se ajusta la extensión y se actualiza el contador.
5. Haz clic en un municipio: verás los atributos del popup. Sin pulsar «Consultar detalle», no debe aparecer la petición específica F2.

### C. Desde PostgreSQL

Consulta de solo lectura en pgAdmin:

```sql
SELECT COUNT(*) AS total_municipios
FROM public.municipio;
```

El resultado esperado en la instalación docente es **12**, y debe corresponder con el tamaño de `features` en F1, siempre que estemos consultando la misma base y los datos no hayan cambiado.

**Si falla:** comprueba primero `/salud` (servidor activo); luego `/municipios` (acceso a la base y respuesta); finalmente revisa la consola y Network (transferencia y representación). `/salud` **no comprueba** PostgreSQL. El servidor puede responder correctamente en esa ruta mientras la consulta F1 falla con HTTP 503.

## 9. Interpretación y límites

- Obtener 12 entidades significa que la consulta recuperó 12 registros; **no demuestra por sí solo la calidad topológica** de los límites administrativos.
- `ST_AsGeoJSON` serializa geometrías; **no transforma el sistema de referencia** ni verifica automáticamente la exactitud de las coordenadas.
- El mapa base OpenStreetMap y la capa de municipios tienen orígenes distintos.
- La respuesta puede contener geometrías densas; ello afecta la transferencia y representación, pero no justifica simplificar sin registrar sus implicaciones cartográficas.
- Una clonación del repositorio sin la geodatabase poblada no permite ejecutar F1 de extremo a extremo.

## 10. Comprobación del aprendizaje

Sin consultar la respuesta, intenta responder: **¿qué tecnología realiza la consulta SQL? ¿Por qué hay una petición HTTP para los municipios si el fondo OpenStreetMap ya es visible? ¿Un clic en el municipio vuelve a ejecutar F1?** Comprueba después cada respuesta en el código y en Network.

## 11. Código y continuidad

**Archivos completos:** [frontend/app.js](../../../frontend/app.js) · [frontend/index.html](../../../frontend/index.html) · [frontend/style.css](../../../frontend/style.css) · [backend/main.py](../../../backend/main.py).

**Documentación histórica:** [Etapa 04 — F1](../../etapa-04-f1-leaflet.md). Sirve para conocer la secuencia de desarrollo, pero puede contener instrucciones de una versión anterior. La implementación vigente se comprueba en los archivos anteriores.

**Siguiente lección:** [F2 — Consulta de detalle municipal](../../etapa-05-f2-detalle-municipal.md). Allí veremos cómo una acción explícita del usuario dispara **una segunda petición** para obtener una superficie geodésica calculada, que F1 no había descargado.
