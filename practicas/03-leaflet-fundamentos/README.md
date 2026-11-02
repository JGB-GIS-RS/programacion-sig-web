# Módulo 03 — Fundamentos cartográficos con Leaflet

**Primer lote incorporado el 2 de noviembre de 2026.** Contiene seis prácticas separadas, derivadas de los ejemplos del docente `002_LEAFLET`; el material original se conserva fuera del repositorio.

| Práctica | Carpeta original | Aporte |
|---|---|---|
| 01-mapa-base | `00_mapa_base` | `L.map` y `L.tileLayer` |
| 02-inicializacion-capas | `01_inicializacion` | capas OSM/Esri y `L.control.layers` |
| 03-controles | `02_controles_mapa` | zoom, escala, capas |
| 04-metodos-mapa | `03_metodos_modificacion_mapa` | `setView`, `panTo`, `fitBounds` y zoom |
| 05-eventos | `04_eventos` | `click`, `zoomend` y `moveend` |
| 06-estado-mapa | `05_metodos_recuperar_estado_mapa` | `getCenter`, `getZoom`, `getBounds` |

## Cambios respecto de los ejemplos de origen

- Los ejercicios usan únicamente Leaflet 1.9.4 por CDN y, según el caso, capas base OSM y Esri; no se reproducen URL de teselas Google no documentadas como API pública.
- Los eventos consultan métodos públicos (`mapa.getZoom()`) en lugar de propiedades internas (`evento.target._zoom`).
- Se reemplazaron bloques demostrativos comentados por botones explícitos en el ejercicio de métodos.
- Se conservaron los tres archivos propios de cada ejercicio para facilitar su explicación independiente.
- Las teselas tienen límites de zoom de 19 en estos ejemplos; no se promete que un proveedor ofrezca niveles adicionales.
- No hay contraseñas, claves de API ni backend propio en este lote.

## Ejecutar localmente

Desde la raíz:

```powershell
python -m http.server 5500
```

Abrir `http://127.0.0.1:5500/practicas/03-leaflet-fundamentos/` y elegir un ejemplo. Se necesita conexión para CDN y teselas de fondo.

## Estado de pruebas

**Verificado:** archivos escritos y recuperados de GitHub, rutas relativas coherentes, revisión de código para evitar enlaces locales absolutos, y validación sintáctica de scripts de este lote en el entorno de trabajo.

**No verificado:** pruebas reales de navegación/solicitudes de teselas en el computador docente, compatibilidad de permisos de red y validación cartográfica exhaustiva. No afirmar que han pasado pruebas de integración en navegador.

La selección y sus pendientes se documentan en [auditoría Leaflet](../../docs/auditoria-coleccion-leaflet.md). El módulo de PostGIS y sus rutas no se modificaron.
