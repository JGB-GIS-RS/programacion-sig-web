# Visor SIG Web del Quindío — apartado docente

## Ruta recomendada de lectura

Primero [guía principal](../../docs/guia-principal-visor.md), luego [modelo final](../../docs/modelo-geodatabase-final.md), [contrato F1–F5](../../docs/funcionalidades.md) y [F5](../../docs/etapa-08-f5-equipamientos.md). Las etapas anteriores explican la evolución del proyecto, no siempre su último estado.

Este apartado reúne el **ejercicio integrador del visor desarrollado durante las últimas sesiones**. Su objetivo es explicar y ofrecer acceso a la aplicación F1–F5 sin mover su implementación existente.

## Arquitectura

- **Frontend:** [`frontend/`](../../frontend/) (HTML, CSS, JS y Leaflet).
- **Backend:** [`backend/main.py`](../../backend/main.py) (Python, FastAPI y Psycopg).
- **Datos:** PostgreSQL/PostGIS local, base `programacion_sig`.
- **SQL y guías:** [`sql/`](../../sql/) y [`docs/`](../../docs/).

## Funcionalidades

| Código | Funcionalidad | Operación |
|---|---|---|
| F1 | Municipios del Quindío | `GET /municipios` |
| F2 | Superficie y detalle | `GET /municipios/{codigo}` · `ST_Area` |
| F3 | Identificación por clic | `GET /consultas/ubicacion` · `ST_Covers` |
| F4 | Proximidad a sedes de salud | `GET /consultas/proximidad` · `ST_DWithin` y `ST_Distance` |
| F5 | Equipamientos por municipio y tipo | `GET /equipamientos/municipio/{codigo}?tipo=1|2` |

**Datos:** 12 municipios y 645 equipamientos (418 educativos, 227 de salud); F4 mide distancia geodésica directa en metros, no desplazamiento vial. F5 selecciona por atributos administrativos, no por contención geométrica.

## Cómo abrir

Desde la raíz del repositorio con PostgreSQL funcionando y `.env` configurado:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

- Visor: `http://127.0.0.1:8000/`
- Documentación de API: `http://127.0.0.1:8000/docs`
- Apartado del laboratorio: `http://127.0.0.1:5500/practicas/05-sig-postgis-fastapi/` (si el portal se sirve por `python -m http.server 5500`).

Este apartado es estático y documental; **no aloja el backend ni expone una base pública**.

## Recursos

- [Especificación funcional](../../docs/funcionalidades.md)
- [Hoja de ruta y etapas](../../docs/hoja-de-ruta.md)
- [Arquitectura](../../docs/arquitectura.md)
- [README general](../../README.md)

No se modifica ni duplica el código de F1–F5. El apartado ofrece navegación y orientación pedagógica para el ejercicio existente.
