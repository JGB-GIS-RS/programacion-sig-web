# Módulo 04 — Integración y herramientas de Leaflet

Este módulo contiene **adaptaciones docentes** de ejercicios anteriores, con archivos independientes. No son copias literales ni preservan todas las funciones experimentales del material original.

| Práctica | Fuente conceptual | Resultado |
|---|---|---|
| [01-barra-lateral-busqueda](01-barra-lateral-busqueda/) | `06_1_mapa_barra_lateral_busqueda` | Panel CSS Grid, filtro de lugares y `flyTo`. Lugares de demostración; **no inventario verificado** |
| [02-dibujo-leaflet-draw](02-dibujo-leaflet-draw/) | `10_plugin_Leaflet.draw` | Leaflet 1.9.4, complemento Leaflet.draw 1.0.4, dibujo/edición/borrado |

## Dependencias y ejecución

Desde la raíz del repositorio ejecutar `python -m http.server 5500` y abrir `http://127.0.0.1:5500/practicas/04-leaflet-integracion/`.

Estas prácticas usan Leaflet por CDN y teselas OpenStreetMap; la segunda usa además Leaflet.draw. Requieren conexión. Se comprobó que los archivos se publicaron en el repositorio; **las interacciones y los recursos externos no han sido comprobados aún en navegador**.

## Estado de los ejercicios pendientes

- **Ruteo LocationIQ:** las copias originales `09_a_ruteo_basico`, `09_b_ruteo_interactivo` y `09_c_ruteo_plugin` contienen una clave de acceso escrita en código cliente. **Se omitió deliberadamente el valor del repositorio nuevo**. Es recomendable revocarla/rotarla en la cuenta del proveedor y evitar que una clave privada se distribuya en JavaScript público. Para una práctica reproducible, implementar un backend o intermediario que gestione el secreto y proteja el servicio. No publicar una adaptación que parezca funcional sin proveedor operativo.
- **`11_plugin_Leaflet.MeasurePolygon`:** incluye recursos auxiliares y versiones de plugins que requieren auditoría de compatibilidad y licencias antes de publicarse.
- **Otros controles personalizados:** comparar el aporte con la barra lateral ya incorporada antes de crear una práctica adicional.

## Precisión cartográfica

Las coordenadas del buscador son puntos **ilustrativos**, no localizaciones verificadas como elementos oficiales. Las geometrías de Leaflet.draw son digitalizaciones de pantalla: la actividad no determina su exactitud posicional ni genera cálculos de área geodésica.

La aplicación PostgreSQL/PostGIS, en `backend/` y `frontend/`, permanece intacta.
