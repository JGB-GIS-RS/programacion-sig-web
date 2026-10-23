# Etapa 04 — F1: representación de municipios en Leaflet

**Estado:** código frontend incorporado a GitHub; integración y prueba visual **pendientes de verificar en el computador del docente**.

## Propósito

Conectar el geovisor web con la API ya comprobada localmente, que respondió a `GET /municipios` con una `FeatureCollection` y **12 municipios**.

La arquitectura de esta etapa es **Leaflet → HTTP → FastAPI/Psycopg → PostgreSQL/PostGIS → GeoJSON → Leaflet**. No se utiliza un archivo GeoJSON estático para simular la consulta.

## Archivos

- [`frontend/index.html`](../frontend/index.html): elementos del panel, mapa y carga de Leaflet 1.9.4.
- [`frontend/style.css`](../frontend/style.css): diseño del visor y adaptación a distintas pantallas.
- [`frontend/app.js`](../frontend/app.js): `fetch("/municipios")`, `L.geoJSON()`, encuadre con `fitBounds()`, conteo, manejo de errores y popup local.

La capa de polígonos depende de la API local. Las teselas del fondo son de OpenStreetMap (requieren conexión a Internet).

## Integrar con backend/main.py local

**No reemplazar el backend ya operativo.** Este archivo Python todavía no se ha versionado en GitHub; existen `/salud` y `/municipios` en la copia del docente.

Primero recuperar `frontend/`:

```powershell
git pull origin main
```

Al **final** de `backend/main.py`, después de las rutas existentes, añadir lo siguiente:

```python
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

CARPETA_FRONTEND = Path(__file__).resolve().parent.parent / "frontend"

app.mount("/static", StaticFiles(directory=str(CARPETA_FRONTEND)), name="static")

@app.get("/", include_in_schema=False)
def abrir_geovisor():
    return FileResponse(CARPETA_FRONTEND / "index.html")
```

Este fragmento supone que ya existen `from pathlib import Path` y `app = FastAPI(...)`, como en el backend local previamente verificado. No crear la carpeta `frontend` dentro de `docs` o `backend`.

**Motivo:** FastAPI servirá HTML, CSS, JavaScript y el endpoint geográfico en `http://127.0.0.1:8000`, sin necesidad de habilitar CORS en esta fase.

## Ejecutar y comprobar

En VS Code, desde la raíz `programacion-sig-web`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

Si el servidor ya estaba ejecutándose con `--reload`, al guardar `main.py` debería reiniciarse. No lanzar dos servidores en el mismo puerto.

Abrir [http://127.0.0.1:8000/](http://127.0.0.1:8000/).

**Aceptación F1** (pendiente de evidencia): visualizar los 12 polígonos, ajustar extensión automáticamente, confirmar en las herramientas del navegador una petición HTTP 200 a `/municipios`, ver 12 entidades y comprobar el popup local de un municipio.

El popup solo muestra atributos **ya descargados**. No supone una consulta adicional SQL: esa distinción se desarrollará en F2. Las consultas espaciales F3/F4 y el modelo ampliado de equipamientos están pendientes.

No subir `.env`, credenciales ni `.venv` a Git.
