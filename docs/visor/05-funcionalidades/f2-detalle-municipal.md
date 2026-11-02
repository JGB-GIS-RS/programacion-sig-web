# F2 · Consultar el detalle y la superficie de un municipio

[← F1: visualizar municipios](f1-municipios.md) · [Menú F1–F5](index.md) · [Siguiente: F3](../../etapa-06-f3-identificacion-espacial.md)

**Pregunta:** ¿cómo consultamos un dato que no se descargó al cargar el mapa, por ejemplo, la superficie de Armenia?

**Al finalizar podrás:** distinguir los atributos que ya tiene Leaflet de una consulta nueva al servidor, explicar un parámetro de ruta HTTP y comprender cómo PostGIS calcula un área geodésica en km².

## 1. Qué cambia respecto a F1

En **F1**, la aplicación descargó de PostGIS los polígonos de los 12 municipios, sus códigos y nombres. Esos atributos ya están disponibles en el navegador: por eso abrir un popup no requiere otra consulta.

En **F2**, el usuario decide consultar un dato adicional: **la superficie calculada de un municipio**. El navegador envía el código municipal y PostGIS realiza el cálculo. La aplicación no necesita volver a descargar el polígono.

La diferencia principal es esta: **F1 carga un conjunto de entidades; F2 consulta información calculada de una entidad concreta cuando el usuario la solicita**.

## 2. La interacción del usuario

1. Haz clic en un municipio del mapa para abrir su popup.
2. Observa que aparecen el **nombre** y el **código DIVIPOLA**. Esos datos proceden de F1.
3. Pulsa **«Consultar detalle»**.
4. El popup informa que está consultando PostGIS y después muestra la superficie calculada, expresada en km².

El botón es creado por la función `prepararMunicipio(feature, capa)` de [`frontend/app.js`](../../../frontend/app.js). El código registra un evento `click` sobre ese botón, que llama a `consultarDetalle(codigoMunicipio, resultado, boton)`. **Un clic sobre el polígono y un clic sobre el botón no hacen lo mismo.**

## 3. JavaScript: enviar el código municipal

Este es el fragmento central de `consultarDetalle()`:

```javascript
const respuesta = await fetch(
  "/municipios/" + encodeURIComponent(codigo),
  { headers: { Accept: "application/json" } }
);
```

- `codigo` identifica el municipio del popup; por ejemplo, **63001** corresponde a Armenia.
- `encodeURIComponent(codigo)` codifica el valor para utilizarlo como segmento de una URL. **No sustituye la validación del servidor**.
- La URL resultante tiene esta forma: `GET /municipios/63001`.
- La respuesta esperada es **JSON con atributos**, no una capa GeoJSON nueva: F2 no necesita transmitir la geometría.

El frontend deshabilita temporalmente el botón durante la consulta, comprueba el estado HTTP y valida que el campo `area_geodesica_km2` contenga un valor numérico finito. Después presenta el resultado con dos decimales. En caso de error informa al usuario y vuelve a habilitar el botón.

## 4. FastAPI: recibir y validar el código

En el [backend vigente](../../../backend/main.py), la ruta es:

```python
@app.get("/municipios/{codigo}")
def consultar_detalle_municipal(codigo: str):
```

Las llaves `{codigo}` indican un **parámetro de ruta**: FastAPI obtiene el valor a partir de la dirección solicitada. No es un parámetro de consulta `?codigo=...`.

Antes de ejecutar SQL, el backend comprueba que el código tenga **exactamente cinco dígitos ASCII**. Si su formato no es válido, devuelve **HTTP 422**. Si el formato es correcto pero ese municipio no está en la tabla, devuelve **HTTP 404**. Si Psycopg detecta un error de conexión o consulta a la base de datos, el endpoint devuelve **HTTP 503**.

Son errores diferentes: un formato incorrecto, una entidad no encontrada y un problema de servicio **no deben interpretarse como una misma situación**.

## 5. PostGIS: calcular la superficie

SQL **literal del backend vigente**:

```sql
SELECT
    cod_municipio,
    nombre,
    ST_Area(geom::geography) / 1000000.0
        AS area_geodesica_km2
FROM public.municipio
WHERE cod_municipio = %s;
```

Leamos la consulta en orden lógico:

1. `FROM public.municipio`: trabajamos con los polígonos municipales almacenados.
2. `WHERE cod_municipio = %s`: buscamos un municipio específico.
3. `ST_Area(geom::geography)`: calculamos la superficie sobre el modelo geodésico utilizado por PostGIS para el tipo `geography`.
4. `/ 1000000.0`: convertimos **metros cuadrados a kilómetros cuadrados**.

**¿Por qué convertimos `geom` a `geography`?** La columna almacena un `MultiPolygon` en EPSG:4326, cuyas coordenadas angulares están expresadas en grados. Una operación planar aplicada directamente a esa geometría no devolvería una superficie en m². La conversión a `geography` permite que `ST_Area` devuelva una superficie geodésica en metros cuadrados, utilizando por defecto el cálculo esferoidal de PostGIS.

**Precisión científica:** el resultado depende de los límites digitalizados de la geometría cargada y del método de medición. No debe presentarse automáticamente como la superficie administrativa oficial publicada por una entidad estatal.

**¿Qué significa `%s`?** Es un marcador para un valor que Psycopg suministra por separado:

```python
cursor.execute(sql, (codigo,))
registro = cursor.fetchone()
```

Así no se construye una sentencia SQL concatenando el texto recibido del usuario. El ejemplo con `%s` es código parametrizado de Python/Psycopg; **no se debe pegar sin adaptación directamente en pgAdmin**.

## 6. Respuesta de la API

Una vez recuperado el registro, FastAPI devuelve un objeto con tres atributos:

```json
{
  "cod_municipio": "63001",
  "nombre": "ARMENIA",
  "area_geodesica_km2": 123.45
}
```

**123.45 es un número estrictamente ilustrativo; no representa una medición real de Armenia.** Para conocer el resultado de tu base de datos, ejecuta el endpoint. La API redondea el valor numérico a dos decimales mediante `round(registro[2], 2)`.

Observa la diferencia con F1: este JSON **no contiene `type: "FeatureCollection"`, ni `geometry` ni `coordinates`**. Es una respuesta de datos alfanuméricos.

## 7. Leaflet: presentar el cálculo en el popup

El frontend interpreta `area_geodesica_km2`, comprueba que sea numérico y lo muestra dentro del mismo popup donde el estudiante pulsó el botón:

```javascript
const datos = await respuesta.json();
const area = Number(datos.area_geodesica_km2);
```

La presentación utiliza `Intl.NumberFormat("es-CO")` para mostrar dos cifras decimales con el formato numérico habitual en Colombia. Esto **no cambia el valor calculado en PostGIS**: únicamente controla su representación textual.

F2 no dibuja una geometría nueva. La capa municipal que vemos continúa siendo la cargada previamente mediante F1.

## 8. Verificación reproducible

**Prueba 1 — petición válida:** con el backend y la geodatabase activos, abre:

```text
http://127.0.0.1:8000/municipios/63001
```

Comprueba HTTP 200, el código y el nombre, y un valor numérico en `area_geodesica_km2`. **No se anticipa aquí la cifra**, porque depende de la geometría efectivamente almacenada.

**Prueba 2 — navegador:** abre el visor, entra en F12 → Network, selecciona un municipio y observa el popup. Antes de pulsar «Consultar detalle» **no debe haberse solicitado `/municipios/63001` por el simple hecho de abrir ese popup**. Al pulsar el botón, debe aparecer la petición individual.

**Prueba 3 — error por formato:** solicita `/municipios/ABC`. Resultado esperado: HTTP 422.

**Prueba 4 — código inexistente:** solicita `/municipios/99999`. En el conjunto docente documentado, el resultado esperado es HTTP 404. En cualquier otra base, primero verifica que no exista ese código.

**Prueba 5 — contraste en PostgreSQL:** en pgAdmin puedes ejecutar una consulta de solo lectura con un valor concreto, en lugar del marcador Psycopg `%s`:

```sql
SELECT
    cod_municipio,
    ST_Area(geom::geography) / 1000000.0 AS area_km2
FROM public.municipio
WHERE cod_municipio = '63001';
```

El número sin redondear de SQL y el que entrega la API deben concordar **al redondear a dos decimales**, si se consulta la misma base y la geometría no ha cambiado.

**Si la API devuelve 503:** comprueba la conexión a PostgreSQL; que `/salud` responda correctamente solo acredita que está operativo el servidor FastAPI.

## 9. Qué podemos concluir y qué no

- **Sí podemos afirmar** que la API calcula una superficie geodésica de la geometría almacenada para el código solicitado.
- **No podemos afirmar**, solo por obtener HTTP 200, que el límite municipal sea el más actualizado o esté libre de errores cartográficos.
- El redondeo a dos decimales es una decisión de salida del sistema; **no constituye una estimación de incertidumbre ni certifica exactitud centesimal de km²**.
- Una petición F2 no modifica los polígonos, los datos de origen ni las relaciones de la geodatabase.

## 10. Comprueba tu comprensión

¿Por qué el popup ya muestra el nombre municipal antes de consultar F2? ¿Qué diferencia existe entre un error 422 y uno 404? ¿Qué ocurriría con las unidades si calcularas `ST_Area(geom)` directamente sobre coordenadas en EPSG:4326?

Contrasta las respuestas con el código y, especialmente, con la prueba de Network.

## 11. Código y continuidad

**Código vigente:** [frontend/app.js](../../../frontend/app.js) · [backend/main.py](../../../backend/main.py) · [frontend/index.html](../../../frontend/index.html).

**Antecedente histórico:** [Etapa 05 — F2](../../etapa-05-f2-detalle-municipal.md). Se conserva para estudiar la evolución, no como sustituto del endpoint vigente.

[← Volver a F1](f1-municipios.md) · [Menú F1–F5](index.md) · [Continuar con F3](../../etapa-06-f3-identificacion-espacial.md)
