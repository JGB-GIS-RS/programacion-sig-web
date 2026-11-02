# Visor SIG Web del Quindío — itinerario de aprendizaje

**Guía editorial del ejercicio integrador · noviembre de 2026**

Esta es la entrada recomendada para entender la aplicación sin perder la trazabilidad del desarrollo. **La explicación sigue el sistema vigente F1–F5**; las [etapas históricas](../hoja-de-ruta.md) permiten reconstruir cómo lo desarrollamos.

## Recorrido principal

1. [Presentación y objetivos](01-presentacion.md): qué construimos y qué debe aprenderse.
2. [Datos y geodatabase](02-datos-geodatabase.md): fuentes, cuatro tablas, relaciones y garantías de integridad.
3. [Arquitectura funcional](03-arquitectura.md): de un clic en el mapa a una consulta PostGIS y su respuesta.
4. [Preparación y ejecución](../guia-principal-visor.md#5-ejecutar-en-el-computador-docente): instalación docente, entorno y límites de reproducibilidad.
5. [F1–F5: funcionalidades y pruebas](../funcionalidades.md): consulta de municipios, área, identificación espacial, proximidad y equipamientos. Guías detalladas [F1](../etapa-04-f1-leaflet.md), [F2](../etapa-05-f2-detalle-municipal.md), [F3](../etapa-06-f3-identificacion-espacial.md), [F4](../etapa-07-f4-proximidad-salud.md) y [F5](../etapa-08-f5-equipamientos.md). **Algunas etapas conservan fragmentos históricos**; consultar siempre el código actual para el contrato vigente.
6. [Verificación](../funcionalidades.md#matriz-de-verificacion): criterios de comprobación de HTTP, SQL y GeoJSON.
7. [Código y reproducibilidad](../guia-principal-visor.md#2-donde-esta-cada-parte): archivos y condiciones para ejecutar el sistema.

## Código fuente vigente

- [HTML del visor](../../frontend/index.html) · [CSS](../../frontend/style.css) · [JavaScript/Leaflet](../../frontend/app.js)
- [Backend Python/FastAPI](../../backend/main.py)
- [Scripts SQL históricos de preparación municipal](../../sql/) · [Modelo físico vigente](../modelo-geodatabase-final.md)

**Cómo leer cada ejemplo:** pregunta geográfica → acción del usuario → petición HTTP → validación en FastAPI → SQL/PostGIS → JSON o GeoJSON → visualización → verificación → límites de interpretación. Los fragmentos SQL con `%s` son plantillas parametrizadas por Psycopg, no sentencias listas para pegar sin adaptación en pgAdmin.

## Límites de lo publicado

La base de datos poblada no está alojada en GitHub. Las cantidades de registros son las verificadas durante las prácticas, no un inventario universal actualizado. Los diagramas sirven de apoyo a la comprensión, pero no sustituyen el DDL o el código ejecutado. La documentación física ya incorpora resultados de auditoría en pgAdmin; falta publicar una exportación íntegra del esquema y pruebas automatizadas.
