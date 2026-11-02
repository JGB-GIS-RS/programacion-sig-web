# Etapa 07 — F4: proximidad a sedes de salud con PostGIS

**Estado:** desarrollada en el proyecto SIG Web y verificada funcionalmente en el entorno docente (noviembre de 2026). Sustituye la versión inicial de F4, que medía distancia a polígonos municipales.

## Pregunta espacial

**¿Qué sedes de prestadores de salud se encuentran dentro de un radio elegido por el usuario alrededor de un punto del mapa?**

Se consultan los puntos de `public.equipamiento` que tienen `id_tipo = 2`. No se agregan registros ni se modifica la estructura de la geodatabase.

## Componentes involucrados

- Frontend: `frontend/index.html` contiene el radio editable y el botón «Consultar salud cercana»; `frontend/app.js` captura coordenadas, realiza `fetch()`, verifica el GeoJSON, dibuja círculo y puntos, y presenta distancias y popups.
- Backend: `backend/main.py`, función `consultar_proximidad()`, expuesta en `GET /consultas/proximidad`.
- Base de datos: `public.equipamiento` con `geom geometry(Point,4326)` y `id_tipo=2` para Salud; PostGIS ejecuta selección y medición geodésica.

No interviene pgAdmin 4 durante la consulta del usuario: es una herramienta opcional de administración y diagnóstico.

## Contrato del endpoint

```http
GET /consultas/proximidad?lon=-75.70909&lat=4.53458&radio_m=10000
Accept: application/geo+json
```

- `lon`: valor numérico entre −180 y 180.
- `lat`: valor numérico entre −90 y 90.
- `radio_m`: radio en metros, mayor que 0 y hasta 50.000. Si se omite en la API, el backend usa 2.000 m.
- Respuesta exitosa: HTTP 200, `application/geo+json`, `FeatureCollection` de geometrías Point; cero coincidencias = `features: []`.
- Parámetros inválidos: error HTTP 422. Error de base de datos atrapado: HTTP 503.

El frontend inicia con 2.000 metros, permite modificarlo **antes** de activar el modo, y fija el radio mientras ese modo permanece activo.

## SQL parametrizado vigente

```sql
WITH punto AS (
    SELECT ST_SetSRID(
        ST_MakePoint(%s, %s), 4326
    )::geography AS ubicacion
)
SELECT
    e.id_equipamiento,
    e.nombre,
    e.codigo_fuente,
    e.direccion,
    ST_AsGeoJSON(e.geom) AS geometria,
    ST_Distance(e.geom::geography, p.ubicacion)
        AS distancia_metros
FROM public.equipamiento AS e
CROSS JOIN punto AS p
WHERE e.id_tipo = 2
  AND ST_DWithin(
      e.geom::geography,
      p.ubicacion,
      %s
  )
ORDER BY distancia_metros, e.id_equipamiento;
```

**Parámetros Psycopg:** `(lon, lat, radio_m)`. La instrucción `ST_MakePoint(lon,lat)` recibe longitud primero; `ST_SetSRID(...,4326)` asigna el sistema de referencia y **no transforma** coordenadas. El *cast* a `geography` permite evaluar distancias en metros; `ST_DWithin` selecciona las sedes dentro o sobre el radio, mientras `ST_Distance` calcula sus distancias y permite ordenarlas. `ST_AsGeoJSON` serializa las geometrías.

### Estructura de la respuesta

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id_equipamiento": 0,
        "nombre": "EJEMPLO ESTRUCTURAL (NO ES UN REGISTRO REAL)",
        "codigo_fuente": "EJEMPLO",
        "direccion": "EJEMPLO",
        "id_tipo": 2,
        "distancia_metros": 0.0
      },
      "geometry": {"type": "Point", "coordinates": [-75.7, 4.5]}
    }
  ]
}
```

**Advertencia:** el bloque anterior es puramente estructural; ninguna entidad ni coordenada de ejemplo pretende representar una sede real. En ejecución se devuelven exclusivamente los registros almacenados en PostGIS.

## Prueba observada en PowerShell

```powershell
$r = Invoke-RestMethod "http://127.0.0.1:8000/consultas/proximidad?lon=-75.70909&lat=4.53458&radio_m=10000"
$r.type
$r.features.Count
$r.features | Select-Object -First 3
```

**Resultado observado:** `FeatureCollection`, **209** sedes. Es un conteo puntual que corresponde a las coordenadas y radio indicados.

## Prueba observada en el navegador

Con el radio de 10.000 metros, se seleccionó otro punto (aproximadamente `lon=-75.65484`, `lat=4.55255`). El visor mostró **204** sedes de salud, círculo de búsqueda, marcadores y lista ordenada por distancia. DevTools → Network registró HTTP **200** para la petición de proximidad.

**Incidencia de integración resuelta:** inicialmente el navegador mantenía en caché una versión anterior de `app.js` que esperaba una lista `municipios` dentro de JSON. El backend nuevo devolvía correctamente GeoJSON, pero el frontend antiguo notificaba «Formato de respuesta de proximidad incorrecto». Recargar la página con DevTools → Network → **Disable cache** activado permitió cargar el código actual y representar las sedes. Esto no fue un fallo de PostgreSQL/PostGIS.

## Pruebas recomendadas antes de usarlo en otro equipo

1. Consultar `GET /salud` para comprobar que FastAPI esté funcionando.
2. Ejecutar el ejemplo de PowerShell y comprobar `FeatureCollection` y número de registros.
3. En el visor, probar un radio pequeño, uno intermedio y uno mayor desde el **mismo punto**; las coincidencias no deberían disminuir si la base no cambia.
4. Probar un radio o coordenada inválidos y comprobar HTTP 422.
5. Probar una ubicación sin sedes dentro del radio; confirmar colección vacía, sin excepción.
6. Verificar que F1, F2, F3 y F5 siguen funcionando y que cambiar entre modos no deja puntos obsoletos en pantalla.

## Interpretación y límites

La distancia es **geodésica en línea directa entre la ubicación seleccionada y el punto almacenado para la sede**. No equivale a ruta peatonal, distancia por carretera, tiempo de acceso, disponibilidad operativa o cobertura efectiva de servicios sanitarios. La geolocalización de las sedes y su condición operativa no se verificaron en campo. No afirmar que «204» o «209» describan el total de sedes de un municipio: son resultados de búsquedas radiales diferentes.

La base local incluye **227** sedes clasificadas como Salud en el conjunto integrado; la F4 puede devolver sedes de distintos municipios porque no impone un filtro administrativo municipal. F5, en cambio, consulta por municipio y categoría, sin aplicar un predicado espacial de proximidad.
