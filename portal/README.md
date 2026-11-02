# Portal · Laboratorio SIG Web

Portada de navegación de las prácticas de **Programación para SIG**.

## Estado de la Fase 1

El portal presenta siete prácticas previstas y el proyecto Geoalerta. **Solo F6 (PostGIS/FastAPI)** ofrece acceso a una aplicación cuya ruta local existente se conoce; las demás se indican claramente como *por integrar*. La tarjeta F6 conduce a `http://127.0.0.1:8000/`: requiere ejecutar el backend en el mismo equipo y disponer de la base PostgreSQL/PostGIS. Un enlace visible **no implica** que el servidor esté encendido.

La portada, estilos y catálogo están aislados en `portal/index.html`, `portal/style.css` y `portal/app.js`. No se ha modificado `backend/`, `frontend/` ni `sql/`.

## Abrir el portal localmente

Desde la raíz del repositorio, iniciar un servidor HTTP para archivos estáticos:

```powershell
python -m http.server 5500
```

Abrir `http://127.0.0.1:5500/portal/`. En otra terminal se puede iniciar el backend PostGIS, desde la raíz:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

Entonces la tarjeta de PostGIS abre `http://127.0.0.1:8000/`. Si no se dispone de los datos o del backend, esa tarjeta no puede mostrar la aplicación.

## Próximas fases

1. Recuperar los ejercicios HTML/CSS/JavaScript, sus imágenes y dependencias; organizarlos como prácticas independientes; probarlos antes de activarlos.
2. Integrar los ejercicios de Leaflet, eventos, ruteo y barra lateral.
3. Decidir si conviene migrar el SIG PostGIS a `practicas/06-postgis-fastapi/`, conservando rutas, documentación y pruebas.

**Publicación:** los archivos de este portal son estáticos y podrían publicarse en GitHub Pages, pero el enlace local `127.0.0.1` seguiría apuntando al equipo del visitante. GitHub Pages no ejecuta FastAPI ni PostGIS; no anunciar F6 como servicio público.

## Criterio docente

Una práctica solo cambia a estado `disponible` cuando tiene una ruta real, sus archivos y recursos están completos y se ha comprobado su ejecución.
