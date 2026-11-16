# Tarea integradora — Desarrollo de un visor SIG Web conectado a una geodatabase

**Asignatura:** Programación para SIG  
**Programa:** Ingeniería Topográfica y Geomática  
**Modalidad:** Individual o por equipos, según indicación docente  
**Fecha de entrega:** Por definir por el docente

## 1. Propósito

Desarrollar una aplicación SIG Web para visualizar, consultar e interactuar con información geográfica almacenada en una geodatabase PostgreSQL/PostGIS, mediante una arquitectura que integre frontend, servicios web y operaciones sobre una base de datos espacial.

El proyecto de referencia es el [SIG Web del Quindío — Módulo 05](README.md). **No se solicita reproducir sus funcionalidades ni cambiar simplemente los nombres o colores**: cada entrega debe resolver un problema geográfico propio mediante datos y consultas pertinentes.

## 2. Geodatabase de trabajo

Se admiten dos alternativas:

**A. Geodatabase existente.** Reutilizar una base espacial funcional, desarrollada previamente o en otro proyecto, siempre que cumpla todos los requisitos de esta tarea.

**B. Nueva geodatabase.** Diseñar, crear y poblar una geodatabase si no se dispone de una apropiada.

**Requisitos comunes obligatorios:**

- Contener **al menos cuatro (4) tablas relacionadas** de manera coherente con el problema geográfico; no se aceptan tablas artificiales creadas solo para cumplir el mínimo.
- Definir claves primarias y, cuando corresponda a las relaciones, claves foráneas e integridad referencial.
- Incluir **al menos una tabla con geometría espacial** que pueda consultarse en PostgreSQL/PostGIS.
- Documentar fuentes y procedencia de los datos, sistema(s) de referencia, tablas, atributos principales, tipos de geometría y relaciones.
- Contar con registros suficientes y pertinentes para demostrar las funcionalidades.

La fuente efectiva de las consultas evaluadas deberá ser PostgreSQL/PostGIS. **Un archivo GeoJSON estático cargado directamente en el navegador no sustituye la integración con la geodatabase.**

## 3. Arquitectura de la aplicación

Implementar una arquitectura cliente-servidor con separación clara de responsabilidades:

| Componente | Tecnología recomendada | Responsabilidad |
|---|---|---|
| Frontend | HTML, CSS, JavaScript y Leaflet | Interacción, mapa y representación de resultados |
| API/backend | Python y FastAPI | Endpoints, validación de parámetros y construcción de respuestas |
| Conexión | Psycopg | Envío de SQL parametrizado y recuperación de registros |
| Geodatabase | PostgreSQL/PostGIS | Almacenamiento, relaciones y operaciones espaciales |
| Intercambio | HTTP, JSON/GeoJSON | Comunicación entre navegador y API |

Puede utilizarse otra tecnología para el backend (por ejemplo, Node.js), si mantiene una arquitectura equivalente y demuestra la ejecución real de SQL en PostgreSQL/PostGIS. Las credenciales deben permanecer fuera del código público y del repositorio.

## 4. Funcionalidades mínimas

Implementar **al menos cuatro (4) capacidades** coherentes con el problema y los datos elegidos:

**F1. Visualización geográfica.** Consultar desde la API una capa almacenada en PostGIS y representarla en Leaflet. No es suficiente cargar directamente un GeoJSON estático.

**F2. Consulta de atributos.** Permitir seleccionar una entidad o aplicar un criterio de búsqueda para recuperar información desde PostgreSQL y mostrarla en el visor.

**F3. Consulta espacial.** Ejecutar en PostGIS al menos una operación espacial pertinente, como `ST_Intersects`, `ST_Contains`, `ST_Covers`, `ST_DWithin`, `ST_Distance` o `ST_Area`. Justificar el predicado, los tipos geométricos, el sistema de referencia y las unidades aplicables.

**F4. Funcionalidad geográfica complementaria.** Desarrollar una operación adicional, distinta de las anteriores, que aporte valor al problema: filtro combinado, consulta espacial o temática adicional, comparación, cálculo o representación derivada de una consulta.

**No es obligatorio replicar F1–F5 del visor del Quindío.** La selección de operaciones debe responder a las preguntas geográficas y a la naturaleza de los datos.

## 5. Requisitos de implementación

Debe poder identificarse en el código:

1. La estructura e interacciones del frontend.
2. Los endpoints HTTP correspondientes a las funcionalidades.
3. La conexión con PostgreSQL.
4. Las sentencias SQL efectivamente ejecutadas en la base.
5. La elaboración de respuestas JSON o GeoJSON.
6. La recepción y representación de dichas respuestas mediante Leaflet.

Las consultas SQL que reciben valores del usuario deberán parametrizarse, sin concatenar directamente entradas externas. No se aceptan resultados simulados o precargados en el frontend como sustituto de consultas reales.

## 6. Verificación del funcionamiento

Presentar evidencia que permita comprobar:

- Las peticiones HTTP del frontend a la API y los endpoints utilizados.
- La ejecución de consultas sobre PostgreSQL/PostGIS.
- La coherencia entre las filas/geometrías recuperadas y las respuestas JSON/GeoJSON.
- La visualización o los resultados producidos en Leaflet.
- **Al menos una consulta reproducida y contrastada directamente mediante SQL en PostgreSQL**, independiente de la interfaz.

Una captura de pantalla del mapa, por sí sola, **no demuestra la integración**.

## 7. Productos de entrega

**A. Aplicación funcional.** Código fuente organizado del frontend y backend; configuración de ejemplo sin secretos; instrucciones de instalación y ejecución.

**B. Geodatabase y reproducibilidad.** Modelo relacional de **mínimo cuatro (4) tablas**, sus claves y relaciones, esquema SQL o procedimiento reproducible de creación y carga, y procedencia de los datos. Si no pueden redistribuirse los datos, documentar cómo obtenerlos legalmente.

**C. Documentación técnica.** Archivo `README.md` con objetivo, fuentes, arquitectura, instalación, ejecución, funcionalidades y relación entre endpoints y consultas.

**D. Evidencias.** Capturas o registros de la interfaz, de la respuesta de la API y de al menos una consulta comprobada en PostgreSQL.

**E. Demostración funcional.** Exposición breve que siga una operación completa desde la acción del usuario hasta el resultado cartográfico, identificando el SQL ejecutado.

La entrega se realizará mediante un **repositorio GitHub accesible para evaluación**. No publicar contraseñas, claves ni el archivo `.env` con credenciales.

## 8. Criterios de evaluación

| Criterio | Ponderación |
|---|---:|
| Geodatabase: cuatro tablas como mínimo, relaciones, datos e integridad básica | 15 % |
| Integración frontend–backend–PostGIS | 25 % |
| Implementación y pertinencia de las funcionalidades | 25 % |
| Verificación técnica de consultas y resultados | 15 % |
| Organización del código y reproducibilidad | 10 % |
| Demostración y explicación técnica | 10 % |
| **Total** | **100 %** |

Se priorizará el funcionamiento comprobable, la corrección de las consultas y la pertinencia geográfica por encima de la complejidad estética de la interfaz.

## 9. Referencia académica

El [Módulo 05 — SIG Web del Quindío](README.md) permite consultar la arquitectura, el frontend, los endpoints, Psycopg, las consultas PostGIS y la construcción de respuestas GeoJSON.

Se permite estudiar y adaptar patrones del ejemplo docente, siempre que se comprendan, justifiquen y documenten. No constituye desarrollo propio una reproducción del caso de referencia con modificaciones superficiales.

**Resultado esperado:** un visor SIG Web funcional que consulte una geodatabase PostgreSQL/PostGIS de al menos cuatro tablas relacionadas y resuelva cuatro capacidades geográficas pertinentes mediante una API y una interfaz cartográfica.
