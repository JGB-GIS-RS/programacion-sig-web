# F5 · Consultar equipamientos por municipio y categoría

[← F4: proximidad a salud](f4-proximidad-salud.md) · [Menú F1–F5](index.md)

**Pregunta:** ¿qué sedes educativas o de prestadores de salud están **registradas administrativamente** en un municipio determinado?

**Al finalizar podrás:** distinguir una consulta por atributos de una selección espacial, explicar cómo se combinan dos filtros SQL y seguir la respuesta GeoJSON hasta su representación en Leaflet.

## 1. El problema: seleccionar registros, no medir distancias

En F4 buscamos sedes de salud dentro de un radio respecto a un punto. **F5 responde una pregunta diferente:** seleccionar las sedes que tienen asignado un **código municipal** y una **categoría** en la base de datos.

La instalación docente utiliza dos tipos en `public.tipo_equipamiento`: **1 = Educativo** y **2 = Salud**. Las sedes están registradas en `public.equipamiento` con los atributos `cod_municipio` e `id_tipo`.

**La clave conceptual:** un equipamiento puede tener un código administrativo municipal y una geometría de punto, pero esa relación administrativa **no demuestra por sí sola** que el punto esté dentro del polígono correspondiente. Para comprobarlo haría falta otro análisis espacial.

## 2. Qué hace el usuario

1. Espera a que F1 cargue los municipios: el selector de municipios se llena con sus códigos y nombres.
2. Elige un municipio y la categoría **Educativo** o **Salud**.
3. Pulsa **«Mostrar equipamientos»**.
4. Observa los puntos, el contador de sedes encontradas y los atributos de cada popup.
5. Puede pulsar **«Ocultar equipamientos»** para retirar la capa.

En la interfaz, el municipio predeterminado es Armenia (`63001`) **si está presente en las opciones**. La categoría inicial es Educativo (`tipo=1`). Son decisiones de la interfaz, no restricciones del modelo de datos.

Mientras se ejecuta F5 se desactivan, cuando corresponde, los modos de consulta por clic de F3 y F4 para que las interacciones no compitan.

## 3. JavaScript: construir la petición

El frontend toma dos valores:

```javascript
const codigo = selectorSedes.value;
const tipo = Number(selectorTipoSedes.value);

const respuesta = await fetch(
  "/equipamientos/municipio/" + encodeURIComponent(codigo) + "?tipo=" + tipo,
  { headers: { Accept: "application/geo+json" } }
);
```

Por ejemplo:

```text
GET /equipamientos/municipio/63001?tipo=1
```

**Dos tipos de parámetros en la misma URL:**

- `63001` es un **parámetro de ruta**, que identifica el municipio.
- `tipo=1` es un **parámetro de consulta**, que determina la categoría.

El frontend comprueba que el código tenga cinco dígitos y que el tipo sea 1 o 2 antes de enviar la solicitud. **La comprobación del servidor sigue siendo necesaria**: no podemos confiar exclusivamente en las validaciones del navegador.

## 4. FastAPI: recibir y validar los filtros

En [`backend/main.py`](../../../backend/main.py) encontramos:

```python
@app.get("/equipamientos/municipio/{codigo}")
def consultar_equipamientos_municipio(
    codigo: str,
    tipo: int = Query(1, ge=1, le=2)
):
```

FastAPI interpreta `codigo` desde la ruta y `tipo` desde la consulta. Si se omite `tipo`, adopta **1 (Educativo)**.

El endpoint exige que el código municipal sea una cadena de **cinco dígitos ASCII**. Los valores de tipo distintos de 1 o 2 y los códigos mal formados se rechazan con **HTTP 422**.

Si hay un error de PostgreSQL/Psycopg, el endpoint devuelve **HTTP 503**. En cambio, un código bien formado que no encuentre registros puede producir una colección vacía con **HTTP 200**. A diferencia de F2, F5 **no comprueba primero que el municipio exista** para responder 404.

## 5. SQL: dos condiciones sobre los atributos

Esta es la consulta exacta que ejecuta el backend:

```sql
SELECT
    e.id_equipamiento,
    e.nombre,
    e.codigo_fuente,
    e.direccion,
    ST_AsGeoJSON(e.geom) AS geometria
FROM public.equipamiento AS e
WHERE e.cod_municipio = %s
  AND e.id_tipo = %s
ORDER BY e.nombre, e.id_equipamiento;
```

**Cómo leerla:**

1. `FROM public.equipamiento AS e` establece la tabla de sedes.
2. `e.cod_municipio = %s` selecciona los registros asociados al municipio solicitado.
3. `AND e.id_tipo = %s` exige que también pertenezcan a la categoría indicada.
4. `ST_AsGeoJSON(e.geom)` convierte sus **puntos** al formato geográfico que recibirá Leaflet.
5. `ORDER BY` devuelve los registros ordenados por nombre y, en caso de empate, identificador.

Psycopg envía los parámetros de manera separada:

```python
cursor.execute(sql, (codigo, tipo))
registros = cursor.fetchall()
```

Esta consulta **no contiene** `ST_Covers`, `ST_Within` ni `ST_Intersects`. Por tanto, **no realiza una prueba geométrica de pertenencia municipal**: filtra por atributos y usa la geometría únicamente para representar las sedes seleccionadas.

El marcador `%s` pertenece a la parametrización de Psycopg; no se pega literalmente en pgAdmin.

## 6. La respuesta GeoJSON

FastAPI transforma las filas recibidas en una colección de entidades de tipo `Point`. Cada una tiene las propiedades:

- `id_equipamiento`: identificador interno de la sede.
- `nombre`: nombre registrado.
- `codigo_fuente`: código procedente de la fuente.
- `direccion`: dirección almacenada, si existe.
- `id_tipo`: categoría consultada.

Las coordenadas del punto forman parte de `geometry`, no de `properties`.

**Diferencia respecto a F4:** F5 **no devuelve** `distancia_metros`. No hay punto de consulta para medir proximidad ni radio de búsqueda.

Si ninguna sede cumple ambos filtros, se obtiene:

```json
{
  "type": "FeatureCollection",
  "features": []
}
```

Eso significa **cero registros coincidentes en la base cargada**, no necesariamente ausencia real de establecimientos.

## 7. Leaflet: dibujar puntos y mostrar atributos

La función `mostrarSedes()` transforma la respuesta en una capa:

```javascript
capaSedes = L.geoJSON(datos, {
  pointToLayer: (_feature, latlng) => L.circleMarker(latlng, {
    radius: 5,
    color: "#173b54",
    weight: 1.5,
    fillColor: tipo === 1 ? "#e5a447" : "#b75472",
    fillOpacity: 0.9
  }),
  onEachFeature: (feature, capa) => {
    // El código vigente construye el popup con nombre,
    // dirección y código de la fuente.
  }
}).addTo(mapa);
```

En el código completo, **Educativo** se representa en color ámbar y **Salud** en un tono rojizo. El popup se construye mediante elementos del DOM y `textContent`, evitando interpretar los valores de los atributos como HTML ejecutable.

Después, el mapa ajusta su vista al **polígono del municipio seleccionado, ya cargado mediante F1**, y presenta la cantidad de sedes devueltas. Ajustar la vista no significa que se haya comprobado la contención geométrica de todos los puntos.

Al cambiar de municipio o categoría, la interfaz limpia la capa anterior. El contador `solicitudSedesActual` evita mostrar una respuesta atrasada de una consulta que ya fue reemplazada.

## 8. Cómo comprobar F5

**A. Petición por categoría.** Con FastAPI y PostgreSQL activos, compara:

```text
http://127.0.0.1:8000/equipamientos/municipio/63001?tipo=1
http://127.0.0.1:8000/equipamientos/municipio/63001?tipo=2
```

Las respuestas deben ser colecciones GeoJSON de puntos. En la instalación docente, las comprobaciones anteriores registraron **112 sedes educativas y 193 de salud** para Armenia. Esos conteos describen aquella versión de los datos, no un inventario municipal certificado ni un resultado invariable.

**B. Comprueba la petición en el navegador.** En F12 → Network observa que el código y la categoría enviados coinciden con los selectores. Verifica HTTP 200 y que la cifra mostrada se corresponda con el número de `features`.

**C. Valida entradas.** Un código como `ABC` o `tipo=3` debe producir HTTP 422. Un código de cinco dígitos sin registros puede devolver HTTP 200 con `features: []`: esto no equivale a HTTP 404.

**D. Contrasta el filtrado en pgAdmin.** Ejecuta una consulta de solo lectura:

```sql
SELECT id_tipo, COUNT(*) AS total
FROM public.equipamiento
WHERE cod_municipio = '63001'
  AND id_tipo IN (1, 2)
GROUP BY id_tipo
ORDER BY id_tipo;
```

Compara los conteos con los de los dos endpoints. Para obtener los registros de un solo tipo puedes consultar `WHERE cod_municipio = '63001' AND id_tipo = 1`.

**E. Verificación espacial adicional — no implementada en F5.** Para investigar posibles discrepancias entre el código municipal y la ubicación geométrica, puedes ejecutar, de manera independiente:

```sql
SELECT e.id_equipamiento, e.nombre
FROM public.equipamiento AS e
JOIN public.municipio AS m
  ON m.cod_municipio = e.cod_municipio
WHERE NOT ST_Covers(m.geom, e.geom);
```

Esta consulta es **un ejercicio de control de calidad propuesto**, no una parte ejecutada por el endpoint F5. Si devuelve filas, conviene revisar los límites, la ubicación y la asignación administrativa antes de concluir cuál dato es erróneo.

## 9. Qué significan y qué no significan los resultados

- El número de sedes refleja los **registros cargados que satisfacen dos condiciones de atributos**; no constituye automáticamente un censo exhaustivo.
- `id_tipo = 2` identifica **sedes registradas de prestadores de salud**, no garantiza que ofrezcan atención de urgencias ni disponibilidad actual.
- Una sede vinculada a un municipio por su código no está necesariamente dentro de su geometría; esa comprobación exigiría un predicado espacial.
- La fuente, fecha y exactitud posicional de los puntos condicionan cualquier análisis territorial posterior.
- El valor predeterminado del selector y el color de los símbolos son decisiones de la interfaz, no propiedades científicas de los equipamientos.

## 10. Comprueba lo aprendido

¿Por qué F5 utiliza dos filtros con `AND` y no `ST_DWithin`? ¿Qué diferencia existe entre **municipio registrado** y **municipio que contiene geométricamente un punto**? ¿Qué puede concluirse cuando la consulta devuelve una colección vacía?

Comprueba las respuestas en el SQL y la pestaña Network.

## 11. Código y cierre del recorrido F1–F5

**Código vigente:** [frontend/app.js](../../../frontend/app.js) · [frontend/index.html](../../../frontend/index.html) · [backend/main.py](../../../backend/main.py).

**Antecedente de desarrollo:** [Etapa 08 — F5](../../etapa-08-f5-equipamientos.md). Se conserva como registro de la evolución del proyecto y no sustituye esta lección de referencia.

Con F5 hemos estudiado tres familias de operaciones: **recuperación por atributos**, **predicados topológicos** y **consultas métricas**. La aplicación combina estas operaciones con HTTP, JSON/GeoJSON y representación cartográfica interactiva.

[← F4](f4-proximidad-salud.md) · [Volver al índice F1–F5](index.md) · [Módulo 05](../../../practicas/05-sig-postgis-fastapi/)
