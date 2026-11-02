# Módulo 05 — SIG Web con PostgreSQL/PostGIS

**Proyecto integrador: visor geográfico del Quindío.**

La [página de entrada del Módulo 05](index.html) presenta **siete apartados en orden pedagógico**. Este README ofrece la misma ruta para quienes consultan el contenido directamente desde GitHub.

| Orden | Apartado | Consulta |
|---|---|---|
| 01 | Presentación y objetivos | [Qué construimos](../../docs/visor/01-presentacion.md) |
| 02 | Fuentes y geodatabase | [Datos y modelo físico](../../docs/visor/02-datos-geodatabase.md) |
| 03 | Arquitectura SIG Web | [Frontend, backend y PostGIS](../../docs/visor/03-arquitectura.md) |
| 04 | Preparación del entorno | [Instrucciones locales](../../docs/guia-principal-visor.md#5-ejecutar-en-el-computador-docente) |
| 05 | Desarrollo F1–F5 | [Menú de las cinco lecciones](../../docs/visor/05-funcionalidades/) |
| 06 | Verificación | [Matriz de comprobación](../../docs/funcionalidades.md#matriz-de-verificacion) |
| 07 | Código y reproducibilidad | [Archivos reales y límites](../../docs/visor/00-indice.md#codigo-fuente-vigente) |

## Código ejecutable del visor

- [Interfaz HTML](../../frontend/index.html) · [Estilos CSS](../../frontend/style.css) · [Lógica JavaScript/Leaflet](../../frontend/app.js)
- [Backend Python/FastAPI](../../backend/main.py)
- [Scripts SQL de las etapas iniciales](../../sql/)

**No se duplicó ni trasladó la aplicación.** El material explica la versión F1–F5 del backend y frontend. Las guías de las etapas anteriores conservan decisiones y fragmentos históricos, debidamente diferenciados del estado vigente.

## Interpretación y límites

La instalación docente utiliza 12 municipios y 645 equipamientos (418 educativos y 227 sedes de salud). Los archivos completos de datos no están publicados. La consulta F4 obtiene distancia geodésica directa, no distancia vial; F5 selecciona por código administrativo, no mediante contención espacial. Los estados de funcionamiento y exactitud posicional de las sedes no han sido verificados en campo.

## Ejecución local

El portal estático puede abrirse desde la raíz del repositorio con `python -m http.server 5500`, accediendo a `http://127.0.0.1:5500/portal/`. Para utilizar el visor hace falta configurar PostgreSQL/PostGIS, las dependencias de Python y `.env`, e iniciar FastAPI mediante:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

Visor local: `http://127.0.0.1:8000/`. GitHub por sí solo no ejecuta este backend.
