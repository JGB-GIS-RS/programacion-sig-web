# Hoja de ruta del proyecto — Programación SIG Web

> **Referencia principal:** [guía del visor](guia-principal-visor.md) · [modelo vigente de cuatro tablas](modelo-geodatabase-final.md) · [Etapa 08, F5](etapa-08-f5-equipamientos.md). Las etapas 01–07 mantienen el relato del desarrollo incremental.

**Estado actualizado: 1 de noviembre de 2026.** Documento de orientación curricular y trazabilidad. La secuencia de las *etapas documentadas* no coincide exactamente con los rótulos E1–E7 que figuraban en la planificación preliminar; prevalece la numeración de las guías existentes.

## Propósito docente

Integrar una geodatabase PostgreSQL/PostGIS con una API en Python/FastAPI y un visor HTML/CSS/JavaScript/Leaflet, demostrando el recorrido **interacción → solicitud HTTP → consulta SQL/PostGIS → respuesta JSON/GeoJSON → representación**. El curso recupera conocimientos anteriores de bases de datos geográficas, sin repetir íntegramente su diseño conceptual y lógico.

## Etapas documentadas y estado

| Etapa | Documento | Resultado / evidencia |
|---|---|---|
| 01 | [Modelo físico de geodatabase](etapa-01-geodatabase.md) | Construcción inicial de `departamento` y `municipio`; PK, FK y geometría municipal |
| 02 | [Carga de municipios](etapa-02-carga-municipios.md) | 12 municipios DANE/DIVIPOLA 2025, EPSG:4326, auditoría geométrica y relacional |
| 03 | [Primer backend FastAPI](etapa-03-primer-backend-fastapi.md) | Conexión Python–Psycopg–PostgreSQL, `GET /salud`, `GET /municipios`, publicación GeoJSON |
| 04 | [F1 — Leaflet](etapa-04-f1-leaflet.md) | Carga automática de municipios mediante `fetch()` y `L.geoJSON()` |
| 05 | [F2 — detalle municipal](etapa-05-f2-detalle-municipal.md) | Consulta bajo demanda y cálculo geodésico `ST_Area(geom::geography)` |
| 06 | [F3 — identificación espacial](etapa-06-f3-identificacion-espacial.md) | Consulta `ST_Covers()` con coordenadas de clic |
| 07 | [F4 — salud cercana](etapa-07-f4-proximidad-salud.md) | Radio en metros, `ST_DWithin()`, `ST_Distance()`, respuesta GeoJSON y visualización de sedes |

**F5:** también está implementada, aunque no tiene todavía una guía de etapa numerada independiente. Su contrato y verificación están recogidos en [funcionalidades](funcionalidades.md) y [README](../README.md). No debe suponerse que F5 sigue pendiente por faltar una guía específica.

## Modelo y datos actuales

El modelo originalmente fue de dos tablas; **posteriormente se amplió y se implementó** con cuatro tablas principales y tres relaciones 1:N:

- `departamento` (1 registro: Quindío).
- `municipio` (12 geometrías `MultiPolygon`, EPSG:4326).
- `tipo_equipamiento` (2 categorías: Educativo=1 y Salud=2).
- `equipamiento` (645 puntos: 418 Educativo y 227 Salud, EPSG:4326).

El archivo [modelo ampliado de cuatro tablas](modelo-ampliado-cuatro-tablas.md) conserva la justificación de diseño, pero algunas partes describen decisiones originalmente propuestas. Para el estado efectivamente implementado, consultar el [README](../README.md) y el código vigente.

**Procedencia:** DANE/DIVIPOLA MGN 2025, DANE/SISE 2026 y SISPRO/REPS. Un registro de las 228 sedes de salud originales fue excluido por inconsistencia entre asignación municipal y geometría. Las tablas de preparación y la base de datos poblada residen localmente; los archivos fuente completos no forman parte del repositorio.

## Funcionalidades actuales

| ID | Qué hace | Backend / respuesta |
|---|---|---|
| F1 | Municipios al abrir el visor | `GET /municipios` → GeoJSON |
| F2 | Detalle y superficie de un municipio | `GET /municipios/{codigo}` → JSON |
| F3 | Municipios que cubren un punto | `GET /consultas/ubicacion` → GeoJSON |
| F4 | Sedes de salud a distancia directa menor o igual al radio | `GET /consultas/proximidad` → GeoJSON |
| F5 | Equipamientos por municipio y categoría | `GET /equipamientos/municipio/{codigo}?tipo=1|2` → GeoJSON |

En F4 la distancia utiliza `geography` y se expresa en metros; **no es distancia vial ni tiempo de viaje**. El filtro por categoría de F5 se realiza sobre atributos y no sustituye una validación espacial de pertenencia municipal.

## Infraestructura y responsabilidades

- **PostgreSQL/PostGIS:** almacena y consulta datos; ejecuta cálculos espaciales.
- **Python/FastAPI y Psycopg:** recibe solicitudes, valida parámetros, consulta la base y construye respuestas.
- **Leaflet/JavaScript/HTML/CSS:** captura eventos, envía `fetch()` y representa resultados.
- **QGIS y pgAdmin 4:** preparación, administración y validación; no participan en cada petición del usuario.
- **Uvicorn:** servidor ASGI local. En la versión actual FastAPI también sirve el frontend desde `/` y `/static`; no es necesario ejecutar Live Server por separado.

El archivo privado `.env` permanece fuera de Git. No publicar secretos. Para iniciar el servidor en un entorno virtual preparado:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

## Evidencia y límites de verificación

Las cinco funcionalidades fueron utilizadas y comprobadas funcionalmente en el equipo docente. Para F4 se registraron dos búsquedas de 10 km desde **puntos diferentes**, con 209 sedes desde PowerShell y 204 en navegador; la diferencia de conteos no implica un fallo. El visor fue corregido mediante recarga sin caché cuando una versión antigua de JavaScript esperaba el formato de respuesta previo.

Estas observaciones **no equivalen a una batería automatizada de regresión**, una evaluación de rendimiento o una validación en campo. La documentación aporta procedimientos, SQL y resultados observados, pero no incluye el conjunto completo de datos necesario para recrear automáticamente la instancia local.

## Criterios pedagógicos de cierre

1. El estudiante explica qué hace cada componente y por qué el navegador no se conecta directamente a PostgreSQL.
2. Distingue interacción local (popup ya cargado) de consulta remota.
3. Diferencia filtrado por atributos de predicados espaciales (`ST_Covers`, `ST_DWithin`).
4. Comprueba en DevTools las peticiones HTTP y el tipo de respuesta.
5. Interpreta adecuadamente unidades, SRID, límites de calidad y alcance de los resultados.

Para el estado operativo ver [README](../README.md) y [especificación funcional](funcionalidades.md). Las guías iniciales permanecen como registro de las etapas de desarrollo; no deben confundirse sus frases históricas de «pendiente» con el estado actual.
