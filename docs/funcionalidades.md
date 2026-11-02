# Especificación funcional vigente y pruebas — F1 a F5

**Estado:** implementación disponible en `backend/main.py` y `frontend/`, contrastada con pruebas manuales en el equipo docente (noviembre de 2026). Los scripts y documentos de etapas anteriores pueden describir propuestas históricas.

## Contrato de la API y comportamientos

| ID | Evento | Método y ruta | Parámetros | Respuesta |
|---|---|---|---|---|
| F1 | Abrir el visor | `GET /municipios` | Ninguno | GeoJSON FeatureCollection; 12 polígonos municipales |
| F2 | Botón «Consultar detalle» en popup | `GET /municipios/{codigo}` | DIVIPOLA de cinco dígitos | JSON: código, nombre, superficie geodésica en km² |
| F3 | Modo identificar y clic en mapa | `GET /consultas/ubicacion` | `lon`, `lat` | GeoJSON FeatureCollection de municipios coincidentes |
| F4 | Modo salud cercana y clic | `GET /consultas/proximidad` | `lon`, `lat`, `radio_m` | GeoJSON FeatureCollection de sedes de Salud con distancias |
| F5 | Selección y botón mostrar | `GET /equipamientos/municipio/{codigo}` | `codigo`, `tipo` (1 Educativo; 2 Salud) | GeoJSON FeatureCollection de sedes |

**F1.** FastAPI lee `public.municipio`, devuelve `cod_municipio`, `nombre` y geometrías mediante `ST_AsGeoJSON(geom)`. Leaflet las dibuja automáticamente al iniciar. Los popups iniciales son locales.

**F2.** `codigo` se valida como cinco dígitos ASCII. PostGIS calcula `ST_Area(geom::geography) / 1000000.0`. El código municipal inexistente devuelve HTTP 404. La respuesta JSON no contiene geometría adicional.

**F3.** `lon` y `lat` se validan en intervalos geográficos. Se evalúa `ST_Covers(m.geom, ST_SetSRID(ST_MakePoint(lon,lat),4326))`. Incluye interior y frontera; en un límite compartido pueden coincidir varios municipios. Fuera del área de estudio puede regresar `features: []`.

**F4.** Consulta las sedes de prestadores de salud en `public.equipamiento`, exclusivamente `id_tipo = 2`. Usa `ST_DWithin()` sobre `geography` para seleccionar puntos a distancia menor o igual al radio, y `ST_Distance()` para ordenarlos por distancia mínima. La interfaz usa 2.000 m inicialmente y acepta valores positivos hasta 50.000 m; el usuario debe finalizar y reactivar el modo para cambiar de radio. La respuesta es GeoJSON, **no** la antigua estructura JSON de municipios. El círculo en Leaflet es una representación visual; la selección la realiza PostGIS. Véase [guía completa F4](etapa-07-f4-proximidad-salud.md).

**F5.** Consulta por atributos `cod_municipio = %s AND id_tipo = %s` (sin predicado espacial), con `ST_AsGeoJSON(e.geom)`; el frontend dibuja puntos ámbar para Educativo y rojizos para Salud, con popup de nombre, dirección y código de la fuente. `tipo` tiene predeterminado 1 para compatibilidad. Ejemplos probados: Armenia `63001`, 112 educativos y 193 de Salud.

## SQL vigente de F4 (resumen fiel al código)

```sql
WITH punto AS (
    SELECT ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography AS ubicacion
)
SELECT
    e.id_equipamiento,
    e.nombre,
    e.codigo_fuente,
    e.direccion,
    ST_AsGeoJSON(e.geom) AS geometria,
    ST_Distance(e.geom::geography, p.ubicacion) AS distancia_metros
FROM public.equipamiento AS e
CROSS JOIN punto AS p
WHERE e.id_tipo = 2
  AND ST_DWithin(e.geom::geography, p.ubicacion, %s)
ORDER BY distancia_metros, e.id_equipamiento;
```

Los marcadores `%s` son parámetros de Psycopg enviados como `(lon, lat, radio_m)`, **no** expresiones listas para ejecutarse sin adaptación en pgAdmin. `geography` permite distancias geodésicas en metros entre los puntos; no se calculan rutas de acceso.

### Ejemplo de petición F4

```text
GET /consultas/proximidad?lon=-75.70909&lat=4.53458&radio_m=10000
```

Respuesta: `{"type":"FeatureCollection","features":[...]}`; cada Feature de punto contiene `id_equipamiento`, `nombre`, `codigo_fuente`, `direccion`, `id_tipo=2` y `distancia_metros`. Una búsqueda sin coincidencias devuelve `features: []`.

## Matriz de verificación

| Caso | Procedimiento | Criterio de aceptación / evidencia |
|---|---|---|
| F1 | Abrir el visor con FastAPI activo | Network: `GET /municipios` 200; 12 municipios dibujados |
| F2 | Clic municipal, luego «Consultar detalle» | Popup local primero; petición independiente 200; área calculada |
| F2 inválido | `GET /municipios/99999` | 404 si no existe (formato válido) |
| F3 interior | Activar identificación y hacer clic | GeoJSON con municipio que cubre el punto |
| F3 frontera | Consultar un punto de límite comprobado | Se conservan posibles múltiples coincidencias |
| F3 exterior | Clic fuera de la cobertura | Respuesta con colección vacía, sin error |
| F4 salud cercana | Elegir `radio_m=10000` y hacer clic en Armenia | HTTP 200, colección de puntos, marcadores y lista por distancia |
| F4 sin resultados | Punto/radio sin sedes cercanas | Colección vacía y mensaje apropiado |
| F4 radio inválido | `radio_m=-10` o `radio_m=60000` | HTTP 422 |
| F4 misma ubicación, radios distintos | Repetir desde el mismo punto con radios crecientes | Número de coincidencias no decreciente para datos constantes |
| F4 código antiguo en caché | Comprobar consola, Network y recargar con caché desactivada | El frontend procesa `FeatureCollection` en lugar del antiguo JSON |
| F5 Educativo | `/equipamientos/municipio/63001?tipo=1` | 112 sedes en la prueba local |
| F5 Salud | `/equipamientos/municipio/63001?tipo=2` | 193 sedes en la prueba local |
| Errores de conexión | Detener FastAPI | El frontend informa error, no inventa resultados |

### Evidencia empírica F4 (pruebas funcionales puntuales)

- PowerShell: `lon=-75.70909`, `lat=4.53458`, `radio_m=10000` → **209** sedes, `type=FeatureCollection`.
- Navegador: `lon≈-75.65484`, `lat≈4.55255`, `radio_m=10000` → **204** sedes con marcadores; Network reportó HTTP 200.

Son puntos diferentes: no son resultados contradictorios ni estimaciones de rendimiento; dependen de coordenadas, radio y versión de datos. No se dispone de una batería automatizada completa de pruebas ni de una copia pública de la geodatabase poblada.

## Consideraciones científicas y de seguridad

- `ST_Covers` es topológico; `ST_DWithin` y `ST_Distance` son métricos. No deben confundirse.
- La distancia de F4 es geodésica en línea directa al punto representativo de la sede; **no** constituye tiempo de viaje, acceso efectivo ni oferta disponible.
- Los equipamientos de Salud son sedes de prestadores, no necesariamente hospitales ni urgencias.
- El atributo `estado` de los registros está «Sin verificar»; la localización y condición operativa no se han validado mediante trabajo de campo.
- Las credenciales están en `.env` local, fuera del repositorio; el frontend nunca se conecta directamente a PostgreSQL.
