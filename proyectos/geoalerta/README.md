# GeoAlerta — Reportes ciudadanos georreferenciados

> **Estado:** propuesta de proyecto docente y definición conceptual inicial (21 de octubre de 2026). No es un servicio municipal operativo ni un canal oficial de emergencias.

## Propósito
Diseñar, implementar y evaluar una aplicación SIG web multiusuario mediante la cual participantes autorizados reporten incidencias urbanas desde sus teléfonos, adjuntando una fotografía, una categoría, una descripción y la posición geográfica del incidente. Los reportes se transmitirán a un servidor y se visualizarán desde un centro de control cartográfico.

## Escenario de validación
- Referencia territorial: entorno urbano de Armenia, Quindío, Colombia.
- Se admitirán ensayos desde otros municipios o sectores donde se encuentren estudiantes, sin exigir que revelen la ubicación de su vivienda.
- Los reportes académicos de prueba se diferenciarán de los casos reales y no se transmitirán automáticamente a autoridades.
- El centro de control permitirá observar la llegada de reportes enviados desde distintos dispositivos y redes.

## Actores
1. **Reportante (estudiante):** crea y consulta sus reportes.
2. **Operador (docente):** recibe, visualiza, filtra y verifica incidencias.
3. **Administrador:** gestiona usuarios, categorías y parámetros de seguridad (fase posterior).

## Recorrido mínimo verificable
1. El estudiante abre la aplicación web en su teléfono mediante HTTPS.
2. Autoriza la ubicación y captura o adjunta una fotografía.
3. Selecciona categoría y escribe descripción.
4. Revisa y, cuando sea necesario, corrige la posición **del incidente** sobre el mapa. Se registra separadamente, cuando exista, la precisión declarada por el dispositivo.
5. Envía el reporte; el servidor valida datos y devuelve un identificador.
6. La aplicación conserva fotografía de manera controlada y registra metadatos y geometría puntual en la base de datos.
7. El docente abre el centro de control Leaflet y visualiza el nuevo reporte junto con atributos, foto y estado.
8. Se comprueba la llegada desde dispositivos y redes diferentes sin intervención manual sobre archivos.

## Arquitectura de referencia
- **Frontend ciudadano:** HTML, CSS, JavaScript y Leaflet; interfaz móvil adaptable, posible PWA futura.
- **Backend:** Python y FastAPI, con endpoints HTTP para crear y consultar reportes.
- **Persistencia geoespacial:** PostgreSQL/PostGIS; referencia de fotografía en almacenamiento de archivos/objetos con acceso controlado.
- **Centro de control:** HTML, CSS, JavaScript y Leaflet.
- **Actualización:** consultas periódicas inicialmente; WebSockets como extensión cuando se justifique. `Tiempo real` deberá definirse mediante una latencia observable y medible.
- **Geometría:** `Point` en EPSG:4326; GeoJSON para intercambiar registros.
- Las credenciales de bases de datos y almacenamiento nunca se expondrán en los navegadores.

## Categorías iniciales candidatas
- Infraestructura vial (huecos y deterioros).
- Alumbrado público.
- Servicios públicos (fugas, alcantarillado).
- Espacio público (mobiliario y grafitis).
- Ambiente (residuos y vertimientos).
- Riesgos físicos (elementos potencialmente peligrosos).

Estas categorías están pendientes de validación docente y no implican atención institucional efectiva.

## Modelo mínimo tentativo de incidencia
| Atributo | Descripción |
|---|---|
| `id` | Identificador único generado por el servidor |
| `categoria` | Categoría controlada |
| `descripcion` | Texto del reportante |
| `geom` | Punto que representa el incidente |
| `precision_m` | Precisión del posicionamiento, si está disponible; no debe confundirse con exactitud verificada |
| `fotografia_ref` | Referencia segura al archivo |
| `fecha_recepcion` | Marca temporal generada por el servidor |
| `estado` | Recibido, en verificación, gestionado o cerrado; flujo por definir |
| `modo_prueba` | Distingue simulación académica de reporte real |

## Ruta incremental
| Etapa | Evidencia |
|---|---|
| 01. Formulación y requisitos | Actores, alcance, política de datos y criterios de aceptación |
| 02. Captura móvil | Foto, nota, categoría y geolocalización revisable |
| 03. Servicio y almacenamiento | API funcional, carga de fotografías y persistencia espacial |
| 04. Centro de control | Mapa Leaflet con consulta de incidencias |
| 05. Actualización y validación | Aparición automática de reportes y pruebas multiusuario |
| 06. Gestión y análisis | Estados, filtros, duplicados y estadísticas (ampliación) |

## Controles obligatorios del piloto
- Participación voluntaria. No exigir captura dentro de viviendas ni publicar domicilios personales.
- HTTPS para geolocalización en teléfonos y transmisión de datos.
- Autenticación y autorización para acceder a fotografías y posiciones sensibles.
- Límites de tamaño y tipo de archivo, comprobaciones del lado del servidor y medidas contra abusos.
- Evitar imágenes identificables de personas o placas; definir tratamiento, conservación y eliminación de datos conforme a la normativa aplicable.
- Separar ubicación del dispositivo y ubicación real de la incidencia; permitir ajuste manual.
- No presentar reportes como hechos verificados hasta su revisión.
- Nunca prometer asistencia inmediata: los peligros inminentes deben comunicarse a canales oficiales de emergencia.

## Decisiones pendientes
1. Polígono urbano de referencia y extensión autorizada para pruebas.
2. Infraestructura de despliegue HTTPS (costo, disponibilidad y control de datos).
3. Mecanismo de autenticación y retención/eliminación de imágenes.
4. Estados y validación de reportes.
5. Métrica operativa de latencia para la recepción y visualización.

## Relación con el repositorio principal
GeoAlerta es un **proyecto docente separado** del geovisor de municipios del Quindío. Reutilizará conceptos de HTTP, FastAPI, PostGIS, GeoJSON y Leaflet, sin modificar la implementación del ejercicio existente.

---
**Historial:** 2026-10-21 — apertura del espacio y registro de los acuerdos conceptuales iniciales.
