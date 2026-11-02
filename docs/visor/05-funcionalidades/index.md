# Desarrollo del visor — funcionalidades F1–F5

[← Módulo 05](../../../practicas/05-sig-postgis-fastapi/) · [Índice general del visor](../00-indice.md)

## Cómo utilizar estas lecciones

Las cinco lecciones describen **una sola aplicación SIG Web**, no cinco programas diferentes. Lee F1 para comprender cómo se comunican el navegador, FastAPI y PostGIS; después, cada funcionalidad introduce una pregunta geográfica nueva.

| Lección | Pregunta que resolvemos | Concepto nuevo |
|---|---|---|
| **[F1 — Visualizar municipios](f1-municipios.md)** | ¿Cómo llegan los polígonos desde PostGIS al mapa? | HTTP, API, SQL, GeoJSON y Leaflet |
| **[F2 — Consultar detalle municipal](f2-detalle-municipal.md)** | ¿Cómo obtener la superficie de un municipio conocido? | Parámetro de ruta, filtro por código y área geodésica |
| **[F3 — Identificación espacial](f3-identificacion.md)** | ¿Qué municipio cubre el punto seleccionado? | Predicado topológico `ST_Covers` |
| **[F4 — Proximidad a salud](f4-proximidad-salud.md)** | ¿Qué sedes están dentro de un radio? | `geography`, `ST_DWithin` y `ST_Distance` |
| **[F5 — Equipamientos municipales](f5-equipamientos.md)** | ¿Qué sedes están registradas por municipio y tipo? | Dos filtros de atributos y representación de puntos |

## El hilo conductor

```text
Interacción del usuario
        ↓
JavaScript / Leaflet
        ↓ petición HTTP
FastAPI / Psycopg
        ↓ sentencia SQL
PostgreSQL / PostGIS
        ↓ registros y geometrías
JSON o GeoJSON
        ↓
Resultado mostrado en el visor
```

**No todas las consultas realizan análisis espacial.** F2 y F5 seleccionan registros por sus atributos; F3 evalúa relaciones topológicas; F4 mide proximidad. F1 recupera las geometrías necesarias para iniciar la visualización. Esta distinción determina qué podemos concluir de los resultados.

## Cómo está redactada cada lección

Cada tema comienza con **una pregunta geográfica**, continúa con la acción del usuario y el código realmente ejecutado, y termina con procedimientos de comprobación y límites de interpretación. Los conceptos explicados en F1 no se repiten extensamente en las lecciones posteriores.

Los ejemplos de URL y SQL son didácticos; cuando muestran cifras o coordenadas ilustrativas se identifican como tales. **Las pruebas documentadas no sustituyen la ejecución local:** requieren FastAPI y una base PostgreSQL/PostGIS poblada.

## Dónde consultar el código

- [Interfaz HTML](../../../frontend/index.html), [CSS](../../../frontend/style.css) y [JavaScript/Leaflet](../../../frontend/app.js).
- [Backend FastAPI, Psycopg y sentencias SQL](../../../backend/main.py).
- [Modelo de geodatabase vigente](../../modelo-geodatabase-final.md).
- [Especificación técnica F1–F5 y matriz de pruebas](../../funcionalidades.md).

**Documentación histórica:** las guías [Etapa 04](../../etapa-04-f1-leaflet.md), [05](../../etapa-05-f2-detalle-municipal.md), [06](../../etapa-06-f3-identificacion-espacial.md), [07](../../etapa-07-f4-proximidad-salud.md) y [08](../../etapa-08-f5-equipamientos.md) muestran la evolución del desarrollo. Se conservan como antecedentes, **no como versiones alternativas del código vigente**.

## Al terminar F5

Podrás explicar por qué el mismo visor utiliza consultas tan distintas, identificar cuál componente realiza cada operación y reconocer qué inferencias **no** justifican los resultados: una relación administrativa no demuestra contención geométrica; proximidad directa no equivale a accesibilidad vial; y un resultado calculado no certifica la calidad de las geometrías de origen.
