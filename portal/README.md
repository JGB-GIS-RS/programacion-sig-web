# Portal académico — Laboratorio SIG Web

**Acceso al menú:** [`portal/index.html`](index.html)

Este portal presenta seis módulos curriculares, con acceso a los índices y ejercicios de cada uno:

1. [HTML y CSS](../practicas/01-fundamentos-web/)
2. [JavaScript](../practicas/02-fundamentos-javascript/)
3. [Fundamentos de Leaflet](../practicas/03-leaflet-fundamentos/)
4. [Integración Leaflet](../practicas/04-leaflet-integracion/)
5. [Visor SIG Web con PostGIS/FastAPI](../practicas/05-sig-postgis-fastapi/)
6. [Proyectos integradores](../proyectos/)

**Organización:** el menú se encuentra en `portal/`; cada módulo tiene su índice HTML. Los ejercicios y su código están organizados en `practicas/`; el proyecto Geoalerta está bajo `proyectos/`. Los archivos ejecutables del visor SIG del Quindío permanecen en `frontend/` y `backend/`, sin duplicar programas.

## Ejecutar el portal

Desde la raíz del repositorio:

```powershell
python -m http.server 5500
```

Abrir `http://127.0.0.1:5500/portal/`. Las páginas introductorias son estáticas, pero requieren conexión para recursos externos como Leaflet y sus teselas.

Para el visor PostGIS, iniciar PostgreSQL y su backend en otra terminal:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

Visor: `http://127.0.0.1:8000/`. **No es un enlace público a un servicio desplegado.**

## Publicación

GitHub muestra de forma predeterminada archivos y carpetas, no esta página HTML como portada. Para que los visitantes naveguen el portal como sitio web hay que configurar una publicación estática, por ejemplo GitHub Pages. La configuración y la dirección pública aún deben comprobarse; este README no afirma que Pages esté activo. GitHub Pages no ejecuta PostgreSQL ni FastAPI.

## Estado y límites

El portal enlaza módulos con contenidos ya incorporados. El inventario universitario, el ruteo externo y otros ejemplos pendientes no se muestran como funcionalmente listos. El material sigue sujeto a pruebas integrales de navegación; los códigos originales de los módulos 01/02 se adaptaron, no se reproducen necesariamente de forma literal.
