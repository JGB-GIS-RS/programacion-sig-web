# Laboratorio SIG Web — Programación para SIG

**Ingeniería Topográfica y Geomática · Repositorio académico**

Este laboratorio reúne prácticas y proyectos para aprender a desarrollar aplicaciones SIG Web, desde HTML y JavaScript hasta la integración de Leaflet, FastAPI y PostgreSQL/PostGIS.

## Módulos del laboratorio

| Módulo | Acceso |
|---|---|
| **01 · HTML y CSS** | [Fundamentos, lecciones y ejercicios](practicas/01-fundamentos-web/) |
| **02 · JavaScript** | [Lógica y programación](practicas/02-fundamentos-javascript/) |
| **03 · Leaflet básico** | [Cartografía interactiva y GeoJSON](practicas/03-leaflet-fundamentos/) |
| **04 · Leaflet avanzado** | [Interfaces, herramientas y plugins](practicas/04-leaflet-integracion/) |
| **05 · SIG Web con PostGIS** | [Visor del Quindío, F1–F5 y documentación](practicas/05-sig-postgis-fastapi/) |
| **06 · Proyectos integradores** | [Inventario geográfico y Geoalerta](proyectos/) |

## Portal visual

[**Abrir la carpeta del portal académico**](portal/) · [Cómo visualizarlo](portal/README.md)

Para abrir el menú interactivo en un computador con el repositorio descargado:

```powershell
python -m http.server 5500
```

Visitar **http://127.0.0.1:5500/portal/**. GitHub presenta este README y los archivos del proyecto, pero no ejecuta automáticamente la página HTML. La publicación pública del portal aún no está confirmada.

**Nota:** las prácticas estáticas pueden abrirse desde el portal; el visor del módulo 05 necesita adicionalmente FastAPI y la geodatabase PostgreSQL/PostGIS configurados. Las fuentes de datos completas no están distribuidas con este repositorio.

El código, las guías técnicas y los antecedentes de cada tema se encuentran **dentro de su módulo**; el README principal funciona únicamente como punto de entrada.
