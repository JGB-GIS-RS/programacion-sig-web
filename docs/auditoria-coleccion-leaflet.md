# Auditoría y selección curricular — colección Leaflet

**Fecha:** 2 de noviembre de 2026  
**Fuente:** paquete docente `002_LEAFLET(3).rar`, analizado fuera del repositorio.  
**Alcance:** comparación inicial de los archivos HTML, JavaScript, CSS y documentación extraídos (77 archivos en 19 carpetas principales; la colección también contiene subcarpetas). **No equivale a una validación funcional en navegador.**

## Reglas de selección

1. Conservar ejercicios que introducen una competencia nueva, incluso si reutilizan HTML/CSS.
2. Distinguir versiones evolutivas de duplicados exactos con comparación de código, no por nombre.
3. Mantener una sola práctica principal para variantes equivalentes; preservar el historial de origen en el inventario.
4. No publicar como demostración operativa archivos con recursos, servicios, dependencias o credenciales no auditados.
5. Evitar subir `node_modules/`, archivos comprimidos anidados, credenciales y paquetes generados.
6. Cada práctica finalmente publicada tendrá una ruta autónoma, propósito, requisitos y prueba funcional documentada.

## Matriz preliminar de decisión

| Origen | Aprendizaje principal | Decisión | Destino curricular | Pendiente antes de activar |
|---|---|---|---|---|
| `00_mapa_base` | Mapa mínimo y teselas | Conservar | M03 / inicialización | Abrir y comprobar teselas |
| `01_inicializacion` | Configuración y capas base | Conservar como evolución | M03 / inicialización | Documentar diferencia frente al anterior |
| `02_controles_mapa` | Controles integrados | Conservar | M03 / controles | Verificar controles |
| `02_controles_mapa/geolocalizacion` | Ubicación del navegador | Conservar por separado | M03 / geolocalización | Permisos, HTTPS/localhost y fallo de acceso |
| `02_1_controles_integracion` | Controles y composición | Comparar y consolidar | M03 / controles | Demostrar aporte respecto a controles_mapa |
| `02_2_control_personalizado` | Extensión/control personalizado | Conservar con revisión | M04 / extensiones | Auditar código auxiliar y atribuciones |
| `03_metodos_modificacion_mapa` | Modificar estado del mapa | Conservar | M03 / métodos | Pruebas de eventos y resultados |
| `04_eventos` | Manejadores de eventos | Conservar | M03 / eventos | Verificar interacción |
| `05_metodos_recuperar_estado_mapa` | Consultar estado de Leaflet | Conservar | M03 / métodos | Revisar salidas |
| `06_1_mapa_barra_lateral_busqueda` | Interfaz y búsqueda | Conservar | M04 / interfaces | Verificar lugares.js y estilos |
| `07_elementos_geometricos` | Capas vectoriales | Conservar | M03 / geometrías | Comprobar CRS y orden de coordenadas |
| `08_1GeoJSON` | Primeros datos GeoJSON | Conservar | M03 / GeoJSON | Verificar disponibilidad de archivos geográficos |
| `08_2_GeoJSON` | Progresión de GeoJSON | Conservar como etapa | M03 / GeoJSON | Evaluar diferencias de lógica |
| `08_3_GeoJSON_filtro_borre una parte por error` | Variante de filtrado | Archivar provisionalmente | Historial de versiones | Señal de edición accidental; no activar |
| `08_4_GeoJSON_botones_filtro` | Filtro mediante botones | Conservar | M03 / GeoJSON | Comprobar filtros y datos |
| `09_a_ruteo_basico` | Petición a servicio de rutas | Conservar condicionado | M04 / ruteo | Revisar API, credenciales y package.json; excluir node_modules |
| `09_b_ruteo_interactivo` | Captura interactiva de ruta | Conservar como evolución | M04 / ruteo | Comprobar proveedor y respuesta |
| `09_c_ruteo_plugin` | Ruteo mediante plugin | Conservar como alternativa | M04 / ruteo | Revisar plugin y dependencias |
| `10_plugin_Leaflet.draw` | Dibujo de entidades | Conservar condicionado | M04 / herramientas | Verificar versión, licencia y dependencia |
| `11_plugin_Leaflet.MeasurePolygon` | Medición/edición poligonal | Conservar condicionado | M04 / herramientas | Revisar ficheros auxiliares y criterio métrico |

**M03:** fundamentos de Leaflet y cartografía interactiva. **M04:** integración de interfaces, herramientas y servicios externos.

## Evidencia concreta de similitud

- La inspección de huellas SHA-256 identificó archivos HTML idénticos entre `01_inicializacion`, `03_metodos_modificacion_mapa` y `07_elementos_geometricos`, aunque sus `script.js` desarrollan temas distintos.
- En la serie `08_2_GeoJSON`, `08_3_GeoJSON_filtro_borre una parte por error` y `08_4_GeoJSON_botones_filtro`, la estructura HTML se reutiliza mientras el JavaScript cambia. Esto **no** justifica eliminar automáticamente ninguna etapa.
- Las tres carpetas `09_a`, `09_b` y `09_c` contienen implementaciones de ruteo diferenciadas. No deben clasificarse como duplicados solo por su tema.

## Riesgos y verificación pendiente

- Dependencias externas y geoservicios pueden exigir acceso a Internet, permisos o claves. No dar por funcional una ruta sin una petición y respuesta verificadas.
- Las operaciones de localización del navegador exigen tratamiento explícito de permisos y contextos seguros.
- Para operaciones métricas distinguir geometría, proyección y distancia: el mapa EPSG:4326 no permite usar grados como metros.
- Auditar cualquier token o clave en código antes de publicar. **No copiar el paquete completo directamente al repositorio.**
- Las pruebas mínimas por práctica serán: apertura por HTTP local, carga sin fallos de recursos, ejercicio de la interacción principal y registro del resultado observado.

## Secuencia de incorporación

**Lote A:** mapa básico, inicialización, controles, métodos, eventos, geometrías y GeoJSON, siempre tras su comprobación individual.  
**Lote B:** interfaz lateral, controles personalizados, ruteo y plugins, tras revisar dependencias.  
**Lote C:** proyectos integradores, gestionados por separado.

La incorporación se hará mediante copias depuradas en `practicas/03-leaflet-fundamentos/` y `practicas/04-leaflet-integracion/`. Mantener `backend/`, `frontend/` y `sql/` de la aplicación PostGIS sin cambios. Solo activar tarjetas en el portal después de una prueba funcional.

## Estado de esta auditoría

**Matriz documental creada.** Los códigos de la colección Leaflet **no han sido publicados todavía** en GitHub. Las decisiones de conservación son curriculares y provisionales; no sustituyen pruebas de ejecución ni una auditoría completa de seguridad y licencias.
