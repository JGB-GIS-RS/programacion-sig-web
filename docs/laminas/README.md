# Láminas del Módulo 05 — plan de integración

Las **10 láminas aprobadas por el docente** están publicadas en [\`docs/visor/laminas/\`](../visor/laminas/) e integradas en los capítulos correspondientes. Esta carpeta conserva el índice y las advertencias editoriales.

| Archivo de la lámina | Ubicación académica |
|---|---|
| `01-plataformas-herramientas.jpg` | [Preparación y ejecución](../visor/04-entorno.md) |
| `02-datos-fuentes.jpg` | [Datos y geodatabase](../visor/02-datos-geodatabase.md) |
| `03-modelo-relacional.jpg` | [Datos y geodatabase](../visor/02-datos-geodatabase.md) |
| `04-arquitectura-funcional.jpg` | [Arquitectura](../visor/03-arquitectura.md) |
| `05-f1-municipios.jpg` | [F1](../visor/05-funcionalidades/f1-municipios.md) |
| `06-f2-superficie.jpg` | [F2](../visor/05-funcionalidades/f2-detalle-municipal.md) |
| `07-f3-identificacion.jpg` | [F3](../visor/05-funcionalidades/f3-identificacion.md) |
| `08-f4-proximidad.jpg` | [F4](../visor/05-funcionalidades/f4-proximidad-salud.md) |
| `09-f5-equipamientos.jpg` | [F5](../visor/05-funcionalidades/f5-equipamientos.md) |
| `10-corazon-proyecto.jpg` | [Presentación](../visor/01-presentacion.md) |

## Observaciones de rigor antes de incrustarlas

1. **Modelo relacional:** la imagen utiliza `nombre_departamento` y `nombre_municipio`, mientras que las tablas verificadas utilizan `nombre` en ambas. El campo `tipo_equipamiento.nombre_tipo` sí existe. Por tanto, la lámina **no es un diccionario de datos ejecutable**; utilizar [modelo físico](../modelo-geodatabase-final.md).
2. **F1–F3:** los fragmentos de SQL de las láminas se deben cotejar con los archivos reales. En las imágenes recibidas aparece `geom`, que sí es el nombre de la columna del código vigente; no confundir con otras versiones históricas.
3. **F4:** la imagen presenta una consulta SQL **esquemática**, no idéntica al backend actual: utiliza `id` donde el código real usa `id_equipamiento`, y no muestra la misma estructura `WITH punto` y orden final. El [SQL ejecutado](../../backend/main.py) prevalece.
4. **F5:** el SQL de la imagen coincide en lo esencial con el filtro administrativo del backend; no debe interpretarse como comprobación de pertenencia geométrica.
5. **Datos:** los conteos 12, 418, 227 y 645 documentan la carga del ejercicio, no cifras dinámicas de un servicio público.

## Integración editorial

La imagen se coloca **al inicio del capítulo relacionado** como organizador visual. A continuación se explica el proceso y se enlaza el código ejecutable. Cada lámina con SQL didáctico llevará el rótulo: «Figura de síntesis; para ejecutar la consulta, usar el SQL vigente de backend/main.py».

Una vez que los JPG se hayan subido a `docs/visor/laminas/`, pueden añadirse referencias Markdown como `![Arquitectura funcional](laminas/04-arquitectura-funcional.jpg)` con rutas relativas correctas al capítulo.
