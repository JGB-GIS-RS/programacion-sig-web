# Etapa 06 — F3: identificación espacial mediante un clic

**Estado (23-10-2026):** frontend F3 publicado en GitHub; **backend local y prueba funcional pendientes**.

## 1. Problema geográfico

Un usuario señala un punto en Leaflet y pregunta: **¿qué municipio o municipios cubren estas coordenadas?**

El visor no debe determinarlo mediante una comprobación client-side de pertenencia; se enviarán las coordenadas al backend para que **PostGIS ejecute el predicado espacial**.

El evento de mapa proporciona `evento.latlng.lng` y `evento.latlng.lat`. El orden en la solicitud y en `ST_MakePoint` es **longitud, latitud**, coherente con EPSG:4326.

## 2. Arquitectura y contrato

```text
Usuario (activar F3 + clic sobre el mapa)
  → Leaflet captura e.latlng
  → GET /consultas/ubicacion?lon=...&lat=...
  → FastAPI valida rangos y ejecuta SQL parametrizado mediante Psycopg
  → PostGIS: ST_Covers(polígono, punto)
  → FeatureCollection GeoJSON (cero, uno o varios municipios)
  → Leaflet marca el clic, resalta las coincidencias y muestra resultado
```

Se usa `ST_Covers`, no `ST_Contains`: **incluye el límite** del polígono. Si un punto cae precisamente sobre una frontera compartida, pueden aparecer varios municipios; la aplicación no fuerza una sola coincidencia.

Un punto que no pertenece a ningún municipio del conjunto debe devolver **HTTP 200 con `features: []`**. No se trata de error HTTP 404.

## 3. Cómo se integra en la instalación local

El frontend está versionado (archivos [app.js](../frontend/app.js), [index.html](../frontend/index.html), [style.css](../frontend/style.css)). El backend `backend/main.py` sigue siendo local y no se debe reemplazar.

1. En VS Code ejecutar `git pull origin main` desde la raíz del repositorio.
2. En el **final** del archivo local `backend/main.py`, agregar el siguiente endpoint.
3. Guardar el archivo y comprobar que Uvicorn reinicia o iniciarlo, manteniendo el puerto 8000.

```python
# F3 — Identificación espacial por coordenadas.
# Agregar al FINAL de backend/main.py.
from fastapi import Query

@app.get("/consultas/ubicacion")
def identificar_ubicacion(
    lon: float = Query(..., ge=-180, le=180),
    lat: float = Query(..., ge=-90, le=90)
):
    sql = """
        SELECT
            cod_municipio,
            nombre,
            ST_AsGeoJSON(geom) AS geometria
        FROM public.municipio
        WHERE ST_Covers(
            geom,
            ST_SetSRID(ST_MakePoint(%s, %s), 4326)
        )
        ORDER BY cod_municipio;
    """

    try:
        with conectar_bd() as conexion:
            with conexion.cursor() as cursor:
                cursor.execute(sql, (lon, lat))
                registros = cursor.fetchall()
    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail="No se pudo consultar la geodatabase"
        )

    entidades = []
    for codigo, nombre, geometria in registros:
        entidades.append({
            "type": "Feature",
            "properties": {
                "cod_municipio": codigo,
                "nombre": nombre
            },
            "geometry": json.loads(geometria)
        })

    return JSONResponse(
        content={"type": "FeatureCollection", "features": entidades},
        media_type="application/geo+json"
    )
```

**Dependencias ya disponibles** en `main.py` según las etapas F1/F2: `app`, `conectar_bd()`, `json`, `psycopg`, `HTTPException` y `JSONResponse`.

El SQL usa `cursor.execute(sql, (lon, lat))` con **parámetros posicionales**, nunca concatenación de valores a la sentencia.

## 4. Cómo operará el geovisor

- Inicio en **modo normal**: F1/F2 siguen funcionando.
- Pulsar **Identificar ubicación** activa F3; se cierran/desvinculan temporalmente los popups de los polígonos, de modo que los clics sobre ellos se propaguen al mapa.
- Un clic muestra un punto de consulta y genera `fetch("/consultas/ubicacion?...")`.
- Si hay coincidencias, el visor resalta las geometrías devueltas y lista sus nombres/códigos.
- Si no hay coincidencias, informa que ningún municipio del conjunto cubre el punto.
- **Finalizar identificación** restaura los popups de F1/F2.
- Las capas de resalte y marcador de F3 son visualizaciones transitorias, no actualizan la geodatabase. Se descartan respuestas antiguas si el usuario vuelve a hacer clic.

## 5. Pruebas esperadas

1. `GET /consultas/ubicacion?lon=-75.7&lat=4.5` es solo una **muestra de formato de URL**, no una garantía de pertenencia a un municipio concreto. Comprobar el resultado con el mapa y/o QGIS.
2. Comprobar en Chrome Network que el clic en modo F3 genera una petición `ubicacion?lon=...&lat=...`, HTTP 200, y su respuesta GeoJSON.
3. Hacer clic **dentro** de Armenia: debería incluir el municipio 63001 si las coordenadas seleccionadas están cubiertas por la geometría del conjunto.
4. Hacer clic **fuera** de los polígonos: HTTP 200 con `features: []`, mensaje de ausencia de coincidencias.
5. Comprobar ausencia de parámetros y coordenadas fuera del rango geográfico: HTTP 422.
6. Si se puede seleccionar de forma fiable un punto exactamente sobre un límite compartido, comprobar varias coincidencias. Esta prueba requiere precisión geométrica; un clic aproximado no demuestra posición exacta sobre el límite.
7. Desactivar el modo F3 y volver a ejecutar **Consultar detalle** desde F2, para confirmar que se mantienen F1 y F2.

**No declarar F3 completada hasta observar el resultado de la implementación local.**

## 6. Notas técnicas

- CRS de las geometrías municipales: EPSG:4326. Un `ST_MakePoint(lon,lat)` en ese mismo SRID es consistente.
- `ST_Covers` puede aprovechar el índice espacial existente sobre `municipio.geom`.
- El GeoJSON completo de cada coincidencia puede ser costoso por densidad de vértices. La simplificación, generalización o una respuesta de atributos más ligera deben evaluarse posteriormente **sin alterar la geometría de referencia**.
- Seguridad: conservar `.env` fuera del control de versiones y no abrir el servidor local a la red.
- El modelo ampliado de cuatro tablas está diseñado, pero aún no implementado; F3 sigue trabajando únicamente con `municipio`.
