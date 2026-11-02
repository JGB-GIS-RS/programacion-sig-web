# Desarrollo del visor — funcionalidades F1–F5

[← Módulo 05](../../../practicas/05-sig-postgis-fastapi/) · [Índice general del visor](../00-indice.md)

Las cinco lecciones explican **una sola aplicación que crece progresivamente**. No son cinco programas independientes. Todas siguen la secuencia: problema geográfico → interacción → JavaScript → FastAPI → SQL/PostGIS → respuesta → Leaflet → comprobación → límites.

| Lección | Pregunta que responde | Estado de la explicación |
|---|---|---|
| **[F1 — Visualización de municipios](f1-municipios.md)** | ¿Cómo obtiene Leaflet los 12 polígonos desde PostGIS? | **Lección completa; patrón editorial** |
| **[F2 — Detalle y superficie municipal](f2-detalle-municipal.md)** | ¿Cómo consultar información adicional de un municipio? | **Lección completa** |
| [F3 — Identificación espacial](../../etapa-06-f3-identificacion-espacial.md) | ¿Qué polígono cubre un punto seleccionado? | Guía histórica existente; adaptación editorial pendiente |
| [F4 — Proximidad a salud](../../etapa-07-f4-proximidad-salud.md) | ¿Qué sedes hay dentro de un radio? | Guía técnica existente; adaptación editorial pendiente |
| [F5 — Equipamientos](../../etapa-08-f5-equipamientos.md) | ¿Qué sedes de una categoría tiene un municipio? | Guía técnica existente; adaptación editorial pendiente |

**Importante:** los enlaces F3–F5 llevan por ahora a sus guías existentes, algunas con instrucciones de desarrollo históricas. El **contrato vigente** se describe en [funcionalidades.md](../../funcionalidades.md) y el código real está en [backend/main.py](../../../backend/main.py) y [frontend/app.js](../../../frontend/app.js). No vuelvas a pegar endpoints de las guías antiguas en el backend actual.

## ¿Dónde está el código completo?

- [HTML](../../../frontend/index.html) · [CSS](../../../frontend/style.css) · [JavaScript y Leaflet](../../../frontend/app.js).
- [API FastAPI, Psycopg y SQL](../../../backend/main.py).
- [Geodatabase: modelo vigente](../../modelo-geodatabase-final.md).

El repositorio proporciona el código, pero **no una copia de la base de datos poblada**. Las cifras mostradas en las prácticas corresponden a la instalación docente documentada.

**Orden recomendado:** comienza por F1 y comprueba el recorrido entero de una petición. En F2–F5 podrás concentrarte en el concepto nuevo sin volver a explicar todas las herramientas desde cero.
