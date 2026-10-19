# Hoja de ruta docente e implementación reproducible

## 1. Orientación curricular

Los estudiantes de **Programación para SIG** ya cursaron Bases de Datos Geográficas y han trabajado con HTML, CSS, JavaScript, Leaflet y eventos. Por tanto, **la geodatabase se introduce como infraestructura disponible**, no como un nuevo curso de modelación de datos.

El énfasis se sitúa en:

1. Conectar software mediante una API.
2. Traducir eventos del geovisor en peticiones HTTP.
3. Ejecutar consultas parametrizadas y espaciales sobre PostGIS.
4. Transformar y publicar resultados como JSON/GeoJSON.
5. Interpretar y comprobar la respuesta en Leaflet.

## 2. Infraestructura prevista

- PostgreSQL con extensión PostGIS habilitada.
- pgAdmin para inspección y comprobación de consultas.
- QGIS para auditar/importar/visualizar datos; **no actúa como servidor API**.
- Python y FastAPI para backend.
- VS Code y navegador con herramientas de desarrollador para frontend.
- Live Server u otro servidor local para servir HTML/CSS/JS por HTTP.

No es necesario rediseñar esquemas relacionales complejos. Basta con recordar a los estudiantes cómo se comprueban una clave única, un tipo geométrico, un SRID y la validez de las geometrías.

La máquina docente ya puede contar con PostgreSQL/PostGIS y QGIS conectados; **esa configuración local no equivale a archivos implementados en este repositorio**.

## 3. Datos municipales: adquisición y auditoría previa

**Territorio:** departamento del Quindío, Colombia; **12 municipios** esperados.

**Fuente candidata:** cartografía municipal del DANE (Marco Geoestadístico Nacional / DIVIPOLA). Antes de descargar y distribuir datos, registrar:

- organismo responsable, nombre del conjunto y enlace;
- fecha de referencia y versión exacta del producto;
- formato de descarga y condiciones de uso;
- códigos de los municipios y nombres de los campos;
- CRS de origen y unidades;
- posibles multipartes, geometrías nulas o inválidas;
- fecha de descarga y pasos de transformación.

No fijar una versión de capa por suposición: verificar el producto efectivamente usado. No subir archivos pesados o de redistribución restringida al repositorio sin revisar su licencia.

### Tabla mínima de trabajo

La **primera versión** puede operar con una sola tabla:

| Columna | Requisito | Uso |
|---|---|---|
| `cod_municipio` | Texto de cinco caracteres, clave primaria | Filtro `/municipios/{codigo}` |
| `nombre` | Texto no nulo | Popup, listado, resultados |
| `geom` | Multipolígono con SRID conocido y geometría no nula | Publicación, identificación y proximidad |

El esquema `municipio` es una **propuesta de interfaz de datos**: antes de imponerlo hay que verificar nombres, tipos y geometrías del insumo descargado. Durante la preparación puede normalizarse una geometría de tipo Polygon a MultiPolygon, sin alterar indebidamente las coordenadas.

Una segunda tabla `departamento` y su relación 1:N son posibles ampliaciones, no prerrequisitos de F1–F4. Las consultas de áreas se calcularán, sin almacenar necesariamente una cifra derivada redundante.

### CRS y validación

Para simplificar el contrato con la API, se propone almacenar `geom` como `geometry(MultiPolygon,4326)`, tras una **transformación real** desde el CRS de origen. Esta decisión se revisa con el conjunto de datos concreto.

- Los GeoJSON de respuesta se publican en EPSG:4326, con orden [longitud, latitud].
- No calcular áreas o distancias métricas sobre `geometry` en grados.
- Para el cálculo geodésico de área o proximidad: usar `geography` cuando proceda, o un CRS proyectado apropiado y documentado.
- Hacer explícito el tratamiento de límites municipales compartidos y geometrías de fuentes distintas.

**Comprobaciones SQL de la carga (después de crear y poblar la tabla):**

~~~sql
-- Conteo de entidades
SELECT COUNT(*) AS n_municipios FROM municipio;

-- Tipos, SRID y geometría
SELECT
    ST_GeometryType(geom) AS tipo,
    ST_SRID(geom) AS srid,
    COUNT(*) AS n
FROM municipio
GROUP BY 1, 2;

-- Problemas de integridad espacial
SELECT cod_municipio, nombre
FROM municipio
WHERE geom IS NULL OR ST_IsEmpty(geom) OR NOT ST_IsValid(geom);
~~~

Para el Quindío se esperan 12 municipios si el insumo es correcto y se filtró por departamento. Verificar también que no haya códigos duplicados y que el conjunto no incorpore municipios de otro departamento.

### Índices

Clave primaria sobre `cod_municipio` e índice GiST sobre `geom` constituyen una base apropiada. Con doce filas, el índice espacial tiene valor didáctico, **no es una mejora de rendimiento demostrable por sí misma**. Si se amplía el conjunto y se mantiene `geom::geography` en F4, analizar un índice GiST sobre la expresión de tipo geography y su uso efectivo con `EXPLAIN ANALYZE`.

## 4. Etapas y criterios de avance

### E1. Datos disponibles desde PostGIS

- Importar municipios, verificar conteo, identificadores, SRID y geometrías.
- Ejecutar al menos una consulta de atributos y una función espacial en pgAdmin.
- Abrir la tabla desde QGIS y comprobar visualmente que es la misma fuente.

**Criterio de avance:** existe una tabla consultable, trazable y coherente en `programacion_sig` o en la base definida para el laboratorio.

### E2. Primer backend FastAPI

- Crear el punto de entrada Python y configurar acceso seguro a PostgreSQL.
- Implementar `GET /municipios` con SQL parametrizado cuando corresponda.
- Preparar la estructura GeoJSON mediante atributos y geometrías leídos de PostGIS.
- Verificar con la documentación interactiva de FastAPI y un cliente HTTP.

**Criterio de avance:** una petición HTTP real obtiene entidades desde la base de datos, no desde un archivo local ni de una respuesta fija.

### E3. Publicación de municipios en Leaflet (F1)

- Crear página y mapa en archivos `index.html`, `style.css` y `app.js`.
- Solicitar `GET /municipios` usando `fetch()`, interpretar la respuesta y cargar `L.geoJSON()`.
- Mostrar carga, error y un encuadre apropiado a las geometrías.

**Criterio de avance:** la pestaña Network documenta la publicación y el mapa coincide con PostGIS.

### E4. Local frente a remoto (F2)

- Mostrar popup local con propiedades que ya estaban en F1.
- Agregar la acción «Consultar detalle» y `GET /municipios/{codigo}`.
- Calcular desde PostGIS un atributo adicional de detalle, como `area_geodesica_km2`.

**Criterio de avance:** el estudiante identifica y demuestra la diferencia entre interacción local y consulta al servidor.

### E5. Identificación espacial por clic (F3)

- Agregar modo de identificar ubicación.
- Enviar lon/lat y ejecutar `ST_Covers()` en PostGIS.
- Devolver GeoJSON y visualizar cero, una o múltiples coincidencias.

**Criterio de avance:** pruebas interior, exterior y límite documentadas; resultado cotejado en SQL.

### E6. Proximidad espacial (F4)

- Incorporar entrada de radio en metros con validación.
- Enviar lon/lat/radio al backend y ejecutar `ST_DWithin()`.
- Resaltar entidades, mostrar contador y señalar radio de referencia si es útil.

**Criterio de avance:** la distancia funciona en metros y la consulta se ejecuta y verifica en PostGIS, no solo en JavaScript.

### E7. Auditoría de integración

Repetir las pruebas de la [matriz de aceptación](funcionalidades.md#matriz-de-comprobación) y explicar todo el recorrido de una acción de usuario. Examinar peticiones y códigos HTTP, SQL, GeoJSON, coordenadas, estado del visor y casos límite.

## 5. Convenciones operativas

**Rutas de API propuestas:**

~~~text
GET /municipios
GET /municipios/{codigo}
GET /consultas/ubicacion?lon=...&lat=...
GET /consultas/proximidad?lon=...&lat=...&radio_m=...
~~~

**Contrato espacial:**
- `lon` y `lat` en grados decimales; geográficas WGS 84.
- `radio_m` en metros; establecer un máximo de práctica (propuesto 50 000).
- GeoJSON en orden [longitud, latitud].
- Las consultas que devuelven geometrías entregan `FeatureCollection`, incluyendo cero resultados.
- Las respuestas de detalle solo contienen información **distinta de la ya transmitida** en la carga inicial.
- Manejo explícito de HTTP 404, 422 y 5xx.

**Controles de implementación:**
- No almacenar credenciales en el repositorio ni enviarlas al frontend.
- Usar consultas SQL con parámetros vinculados, nunca concatenar valores de URL.
- Habilitar CORS solo para el origen del frontend local que se use en clase.
- Mantener el código organizado según responsabilidades comprobadas; no añadir módulos sin necesidad.
- Contrastar casos de prueba con consultas PostGIS independientes.

## 6. Entregables progresivos

| Entregable | Contenido verificable |
|---|---|
| Datos auditados | Fuente, CRS, tabla PostGIS y consultas de validación |
| Backend mínimo | API operativa con endpoints y acceso a PostGIS |
| Frontend mínimo | Mapa Leaflet, capas GeoJSON y manejo de estados |
| F1 y F2 | Publicación, selección local y consulta de detalle |
| F3 y F4 | Identificación por punto y proximidad con SQL espacial |
| Demostración final | Evidencia Network + respuesta HTTP + consulta SQL + mapa |

## 7. Alcance y estado

Este documento no acredita por sí mismo una aplicación funcional. **La documentación define el contrato y la secuencia; el código, los datos y las pruebas se incorporarán de forma progresiva.** No confundir la instalación local del software ni la conexión QGIS–PostGIS con una API integrada.

El núcleo del aprendizaje no es construir el diseño relacional desde cero, sino **programar y justificar cómo las solicitudes de un visor activan consultas reales sobre una base de datos espacial**.
