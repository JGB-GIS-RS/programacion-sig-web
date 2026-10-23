# Etapa 04 — F1: representación de municipios en Leaflet

**Estado: F1 validada funcionalmente en el computador del docente (23 de octubre de 2026).** Se comprobó el visor, la carga de doce municipios, el popup local de Armenia y la petición HTTP 200 mediante las herramientas de desarrollo de Chrome. El código del backend sigue pendiente de versionarse en GitHub.

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

**Aceptación F1 — evidencias observadas:** el visor representa los polígonos municipales y encuadra Quindío; muestra contador de **12 municipios cargados** y estado de GeoJSON recibido; el popup de Armenia identifica **ARMENIA** y **DIVIPOLA 63001**; en Chrome DevTools → Network, la petición `municipios` aparece con **HTTP 200**, tipo `fetch`, iniciada desde `app.js:38`.

**Métricas de esa carga:** 5.228 kB indicados en Network y 715 ms observados. Son medidas puntuales y no permiten establecer rendimiento general; la complejidad de los vértices invita a evaluar simplificación de geometrías más adelante, sin alterar la tabla fuente.

**Verificación adicional posible:** el panel de encabezados HTTP no se mostró en la captura y por ello no se afirma que se haya comprobado visualmente el valor literal `Content-Type`. La API ya había devuelto una `FeatureCollection` de 12 entidades en la prueba con PowerShell. La coherencia topológica entre los doce polígonos sigue fuera del alcance de esta validación.

**Advertencia:** que GitHub contenga el frontend y documentación no significa que la aplicación completa sea reproducible directamente desde el repositorio: `backend/main.py` sigue local y deberá versionarse sin credenciales antes de afirmar reproducibilidad íntegra.

El popup solo muestra atributos **ya descargados**. No supone una consulta adicional SQL: esa distinción se desarrollará en F2. Las consultas espaciales F3/F4 y el modelo ampliado de equipamientos están pendientes.

No subir `.env`, credenciales ni `.venv` a Git.
