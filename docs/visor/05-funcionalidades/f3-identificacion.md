# F3 · Identificación espacial de un municipio

[← F2: detalle municipal](f2-detalle-municipal.md) · [Menú F1–F5](index.md) · [Siguiente: F4](f4-proximidad-salud.md)

**Pregunta:** si seleccionamos una ubicación en el mapa, ¿qué municipio cubre ese punto?

**Al finalizar podrás:** distinguir una búsqueda por atributo (F2) de una consulta espacial (F3), explicar la función `ST_Covers()` y comprobar una identificación desde el navegador, la API y PostGIS.

## 1. Del código municipal a la posición geográfica

En F2 conocíamos de antemano un identificador, por ejemplo `63001`, y consultábamos la superficie correspondiente. **Ahora no partimos de un código municipal**: el usuario hace clic en una posición cualquiera y necesitamos averiguar qué polígono o polígonos la cubren.

En nuestra aplicación, esa relación se determina en **PostGIS**, no inspeccionando los polígonos con JavaScript. Leaflet registra la posición seleccionada y muestra la respuesta.

## 2. ¿Qué hace el usuario?

1. Espera a que se carguen los municipios de F1.
2. Activa el botón **«Identificar ubicación»**.
3. Hace clic sobre el mapa; la aplicación señala el punto y envía sus coordenadas al servidor.
4. Consulta el municipio identificado o, si corresponde, las múltiples coincidencias.

El modo de identificación está separado del comportamiento normal del popup de F1/F2. Mientras está activo, el código desactiva los popups municipales y permite que el clic se use para realizar F3; al salir, los recupera.

En el JavaScript vigente, el mapa tiene este manejador compartido:

```javascript
mapa.on("click", evento => {
  if (modoIdentificar) identificarUbicacion(evento.latlng);
  else if (modoProximidad) consultarProximidad(evento.latlng);
});
```

Solo se ejecuta F3 cuando **`modoIdentificar` está activo**. Esto evita confundir una consulta de ubicación con una consulta de proximidad.

## 3. JavaScript: obtener y enviar las coordenadas

Leaflet proporciona `evento.latlng`; nuestro código obtiene la longitud y la latitud así:

```javascript
const lon = latlng.lng;
const lat = latlng.lat;

const parametros = new URLSearchParams({
  lon: String(lon),
  lat: String(lat)
});

const respuesta = await fetch(
  "/consultas/ubicacion?" + parametros.toString(),
  { headers: { Accept: "application/geo+json" } }
);
```

La petición tiene esta estructura:

```text
GET /consultas/ubicacion?lon=-75.7&lat=4.5
```

Esas coordenadas ilustran **el formato de la URL**, no un caso de prueba cuyo resultado municipal esté aquí certificado.

En F2, `codigo` formaba parte de la **ruta** (`/municipios/63001`). En F3, `lon` y `lat` son **parámetros de consulta**, añadidos después del signo `?`.

**Atención al orden:** el objeto `latlng` de Leaflet ofrece `lat` y `lng`; PostGIS recibe los valores explícitamente como **longitud, latitud** al construir el punto. No deben intercambiarse.

## 4. FastAPI: comprobar las coordenadas

La ruta del backend es:

```python
@app.get("/consultas/ubicacion")
def identificar_ubicacion(
    lon: float = Query(..., ge=-180, le=180),
    lat: float = Query(..., ge=-90, le=90)
):
```

`Query(...)` indica que ambos parámetros son **obligatorios**. FastAPI comprueba que puedan interpretarse como números y que pertenezcan a los intervalos generales de longitud y latitud; ante un dato ausente o inválido responde normalmente **HTTP 422**.

Esta validación **no prueba que el punto esté en el Quindío**: una coordenada válida puede encontrarse fuera de los doce municipios cargados.

## 5. PostGIS: ¿qué significa «cubrir un punto»?

Esta es la consulta exacta del backend:

```sql
SELECT
    cod_municipio,
    nombre,
    ST_AsGeoJSON(geom) AS geometria
FROM public.municipio
WHERE ST_Covers(
    geom,
    ST_SetSRID(
        ST_MakePoint(%s, %s),
        4326
    )
)
ORDER BY cod_municipio;
```

Conviene leer primero el predicado del `WHERE`:

- `ST_MakePoint(%s, %s)` crea un punto con los valores **`(lon, lat)`**.
- `ST_SetSRID(..., 4326)` **asigna** al punto el SRID 4326. No reproyecta coordenadas.
- `ST_Covers(geom, punto)` es verdadero si el polígono **cubre** el punto, incluyendo su interior y sus límites.
- `ST_AsGeoJSON(geom)` permite devolver las geometrías municipales coincidentes para resaltarlas en el visor.

Psycopg suministra los valores con `cursor.execute(sql, (lon, lat))`. Los marcadores `%s` pertenecen al mecanismo de parametrización de Python: no son SQL listo para ejecutar directamente en pgAdmin.

### Tres resultados posibles

| Posición consultada | Resultado esperado en una cobertura correctamente representada |
|---|---|
| Interior de un municipio | Una coincidencia |
| Fuera de los polígonos de estudio | Ninguna coincidencia |
| Límite compartido entre municipios | Potencialmente dos o más coincidencias |

**¿Por qué usamos `ST_Covers` y no `ST_Contains`?** Para un punto situado en el límite de un polígono, `ST_Covers(polígono, punto)` puede devolver verdadero, mientras que `ST_Contains(polígono, punto)` devuelve falso para ese punto de frontera. Esta distinción es relevante para el análisis de límites administrativos.

**Precisión científica:** que el mapa parezca mostrar un punto exactamente sobre una frontera no demuestra que sus coordenadas estén matemáticamente sobre la línea almacenada. La resolución de la geometría, el redondeo, la visualización y la precisión numérica pueden influir en esa comprobación. Tampoco debemos suponer que los polígonos estén libres de solapamientos o separaciones: eso exigiría controles adicionales.

## 6. Respuesta GeoJSON: puede contener cero, una o varias entidades

El backend recorre los registros obtenidos y construye una `FeatureCollection`, del mismo modo que en F1, pero con una diferencia decisiva: **solo contiene los municipios que cubren el punto consultado**.

Cuando ninguno coincide, la respuesta no necesita ser un error:

```json
{
  "type": "FeatureCollection",
  "features": []
}
```

Una colección vacía expresa un **resultado espacial válido sin coincidencias**. No equivale a HTTP 404 ni a un fallo de conexión.

Si hay coincidencias, las entidades incluyen `cod_municipio`, `nombre` y su geometría `MultiPolygon`. El backend no calcula una distancia ni devuelve un único nombre garantizado.

## 7. Leaflet: representar e interpretar las coincidencias

Después de recibir el GeoJSON, JavaScript comprueba que su estructura incluya `FeatureCollection` y un arreglo `features`. Luego aplica un estilo destacado a las geometrías coincidentes:

```javascript
capaCoincidencias = L.geoJSON(datos, {
  interactive: false,
  style: {
    color: "#d16b24", weight: 4,
    fillColor: "#f4b95d", fillOpacity: 0.27
  }
}).addTo(mapa);
```

También muestra un marcador en la ubicación consultada y una lista textual de nombres y códigos.

El código incluye dos protecciones importantes:

- **Limpieza visual:** al realizar otra identificación, retira el marcador y las capas de la consulta anterior.
- **Respuesta desactualizada:** usa un identificador incremental (`solicitudUbicacionActual`) para ignorar respuestas antiguas si el usuario hizo otro clic o abandonó el modo F3.

Eso evita que una respuesta tardía reemplace indebidamente un resultado más reciente. No significa que la solicitud HTTP anterior se haya cancelado.

## 8. Cómo comprobar F3

**A. Prueba básica desde el navegador.** Con FastAPI y PostGIS activos, carga el visor, activa «Identificar ubicación», abre las herramientas de desarrollador (F12 → Network) y haz clic en el mapa. Debe aparecer una petición a `/consultas/ubicacion?lon=...&lat=...`, con respuesta HTTP 200 en condiciones normales.

**B. Prueba de estructura.** En la respuesta comprueba `type: "FeatureCollection"` y el arreglo `features`. Su longitud puede ser 0, 1 o mayor que 1, de acuerdo con las geometrías efectivamente almacenadas.

**C. Prueba de validación.** Consulta `/consultas/ubicacion?lon=200&lat=4.5`. El servidor debe rechazar la longitud fuera de rango con HTTP 422. También debe rechazar parámetros obligatorios ausentes.

**D. Contraste independiente en pgAdmin.** Usa las coordenadas **reales** capturadas en Network; reemplaza los valores ilustrativos por esos números:

```sql
SELECT cod_municipio, nombre
FROM public.municipio
WHERE ST_Covers(
    geom,
    ST_SetSRID(ST_MakePoint(-75.7, 4.5), 4326)
)
ORDER BY cod_municipio;
```

El conjunto de códigos devueltos debe corresponder al recibido por la API, si se consulta la misma base y las mismas coordenadas. **No redondees los valores de Network** al repetir la prueba: podrías desplazar un punto situado cerca de una frontera.

**E. Prueba de frontera.** Para probar específicamente el caso límite, selecciona un punto de frontera obtenido de las geometrías almacenadas, no únicamente mediante un clic visual aproximado.

## 9. Alcance y limitaciones

- F3 evalúa una **relación topológica** entre una ubicación y los polígonos almacenados. No determina automáticamente una dirección postal ni la ubicación administrativa oficial de un predio.
- Un resultado vacío significa que **ninguno de los municipios cargados cubre el punto**, no que esa ubicación no pertenezca a ningún municipio de Colombia.
- Dos coincidencias pueden deberse a un límite compartido, pero también merecen revisión ante posibles solapamientos de los datos.
- `ST_SetSRID` no transforma coordenadas; presupone que los números recibidos corresponden al sistema indicado.
- `ST_Covers` no mide cercanía ni utiliza tolerancias métricas. La búsqueda por radio se tratará en F4.

## 10. Comprueba lo aprendido

Explica por qué F3 no puede resolverse mediante el código DIVIPOLA utilizado en F2. Después distingue estos tres casos: **un punto exterior sin resultados, un parámetro inválido con HTTP 422 y un servidor que no puede consultar PostgreSQL con HTTP 503**.

Finalmente, responde: ¿por qué puede ser correcto que F3 devuelva más de un municipio?

## 11. Código y continuidad

**Código vigente:** [frontend/app.js](../../../frontend/app.js) · [backend/main.py](../../../backend/main.py) · [frontend/index.html](../../../frontend/index.html).

**Antecedente histórico:** [Etapa 06 — F3](../../etapa-06-f3-identificacion-espacial.md). Explica la evolución del desarrollo y no sustituye a esta descripción de la versión implementada.

[← F2](f2-detalle-municipal.md) · [Menú F1–F5](index.md) · [F4: proximidad a sedes de salud →](f4-proximidad-salud.md)
