# 04 · Plataformas y preparación del entorno

[← Arquitectura](03-arquitectura.md) · [Índice del visor](00-indice.md) · [Siguiente: F1–F5](05-funcionalidades/)

## ¿Qué herramientas necesitamos?

![Plataformas y herramientas del ejercicio SIG Web](laminas/01-plataformas-herramientas.jpg)

La figura muestra **qué responsabilidad cumple cada herramienta**, pero no significa que todas intervengan en cada petición del usuario.

| Herramienta | Responsabilidad en el ejercicio |
|---|---|
| PostgreSQL + PostGIS | Almacenar tablas y geometrías; ejecutar consultas SQL y funciones geoespaciales |
| pgAdmin 4 | Crear, inspeccionar y administrar la base de datos; no interviene cuando un usuario consulta el visor |
| QGIS | Preparar, visualizar y revisar los datos antes de la carga |
| Python + FastAPI + Psycopg | Publicar endpoints HTTP y consultar PostgreSQL desde el backend |
| HTML + CSS + JavaScript + Leaflet | Mostrar el visor, recoger interacciones y representar JSON/GeoJSON |

## Qué sucede cuando usamos el visor

Una vez preparados y cargados los datos, el circuito normal no pasa por QGIS ni por pgAdmin: **Leaflet/JavaScript → FastAPI/Psycopg → PostgreSQL/PostGIS → respuesta JSON/GeoJSON → Leaflet**.

No todos los endpoints devuelven GeoJSON: por ejemplo, F2 devuelve un objeto JSON con la superficie calculada.

## Ejecutar la aplicación en el equipo docente

La [guía principal](../guia-principal-visor.md#5-ejecutar-en-el-computador-docente) reúne los requisitos y comandos del entorno. Desde la raíz del repositorio, con PostgreSQL/PostGIS y el entorno virtual preparados:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

Después abre `http://127.0.0.1:8000/` y comprueba el endpoint `/municipios`. **`/salud` solo verifica que FastAPI responde**, no que la base esté conectada.

La base de datos poblada y las credenciales del archivo privado `.env` no están incluidas en el repositorio. No se debe publicar la contraseña ni afirmar que clonar el código reproduce por sí solo todos los resultados.

**Siguiente apartado:** [Desarrollo de F1–F5](05-funcionalidades/).
