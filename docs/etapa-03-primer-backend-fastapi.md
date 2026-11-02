# Etapa 03 — Primer backend Python/FastAPI y publicación GeoJSON

**Proyecto:** Programación SIG Web · Quindío  
**Estado:** documentado retrospectivamente a partir del código vigente y las verificaciones funcionales registradas. Esta etapa antecede a la integración Leaflet (Etapa 04).

## 1. Propósito y alcance

Tras diseñar la geodatabase (Etapa 01) y cargar los doce municipios (Etapa 02), el objetivo fue ofrecer una interfaz HTTP para consultar datos desde otro programa. El primer servicio devuelve los municipios como GeoJSON, obtenidos de PostgreSQL/PostGIS. No se utiliza un archivo GeoJSON fijo ni se accede directamente a PostgreSQL desde el navegador.

**Recorrido:** cliente HTTP → `GET /municipios` → FastAPI → Psycopg → SQL/PostGIS → GeoJSON → cliente.

Esta guía reconstruye y explica el **núcleo inicial** del backend a partir de `backend/main.py`, que actualmente también incluye F2–F5. No debe interpretarse como una transcripción histórica línea por línea ni como evidencia independiente de cada paso original.

## 2. Herramientas y responsabilidades

| Componente | Responsabilidad |
|---|---|
| PostgreSQL/PostGIS | Guardar los municipios y transformar su geometría en representación GeoJSON |
| Python | Lenguaje del backend |
| FastAPI | Exponer rutas HTTP, construir respuestas y manejar errores |
| Psycopg | Establecer conexión PostgreSQL, ejecutar SQL y recuperar filas |
| python-dotenv | Cargar configuración privada del archivo `.env` |
| Uvicorn | Ejecutar la aplicación ASGI localmente |
| PowerShell/navegador | Probar la respuesta del servicio |

QGIS y pgAdmin fueron útiles en la preparación y revisión, pero no participan en cada petición a la API.

## 3. Prerrequisitos

- PostgreSQL/PostGIS instalado y en funcionamiento.
- Base `programacion_sig` y tabla `public.municipio` con los 12 registros validados en la Etapa 02.
- Python con `fastapi`, `uvicorn`, `psycopg` (versión 3) y `python-dotenv` instalados en un entorno virtual.
- Archivo `.env` privado en la raíz con las variables siguientes, **sin incorporar valores reales al repositorio**:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=programacion_sig
DB_USER=USUARIO_LOCAL
DB_PASSWORD=CONTRASENA_LOCAL
```

Los valores son **marcadores de ejemplo**, no credenciales válidas. No subir `.env` o `.venv/` a GitHub. Confirmar la configuración efectiva de la instalación antes de copiar estos ejemplos.

## 4. Conexión a PostgreSQL

El backend vigente ubica el archivo `.env` desde la raíz del proyecto y utiliza Psycopg para conectarse:

```python
RUTA_PROYECTO = Path(__file__).resolve().parent.parent
load_dotenv(RUTA_PROYECTO / ".env")

def conectar_bd():
    return psycopg.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        connect_timeout=5
    )
```

`psycopg.connect()` gestiona la sesión con PostgreSQL. Las operaciones espaciales no se calculan en Psycopg: se ejecutan dentro de PostGIS mediante SQL.

## 5. Primeros endpoints

### Salud del servicio

```python
@app.get("/salud")
def verificar_servidor():
    return {"estado": "operativo", "servicio": "Programación SIG Web"}
```

**Precisión:** esta ruta comprueba que la API responde, pero **no** prueba por sí sola la conectividad de PostgreSQL. La conexión se verifica con una consulta real a la base de datos.

### Publicación de municipios

Ruta `GET /municipios` y función `obtener_municipios()`. Consulta vigente:

```sql
SELECT
    cod_municipio,
    nombre,
    ST_AsGeoJSON(geom) AS geometria
FROM public.municipio
ORDER BY cod_municipio;
```

`ST_AsGeoJSON(geom)` devuelve el contenido geométrico serializado. FastAPI no devuelve las filas SQL sin procesar: construye una `FeatureCollection`, convirtiendo cada geometría con `json.loads(geometria)`:

```python
entidades = []
for codigo, nombre, geometria in registros:
    entidades.append({
        "type": "Feature",
        "properties": {
            "cod_municipio": codigo,
            "nombre": nombre
        },
        "geometry": json.loads(geometria)
    })

return JSONResponse(
    content={"type": "FeatureCollection", "features": entidades},
    media_type="application/geo+json"
)
```

La conexión y la consulta se ejecutan dentro de bloques contextuales `with conectar_bd() as conexion` y `with conexion.cursor() as cursor`; `cursor.execute(sql)` envía SQL y `cursor.fetchall()` recupera filas. Si Psycopg informa un error de base de datos, el endpoint responde HTTP 503 con un mensaje controlado.

## 6. Ejecución y pruebas

Desde la raíz, con el entorno virtual disponible:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

Servicio: `http://127.0.0.1:8000`. Verificación:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/salud"

$r = Invoke-RestMethod "http://127.0.0.1:8000/municipios"
$r.type
$r.features.Count
$r.features[0].geometry.type
```

En el conjunto de datos validado en el equipo docente se espera `FeatureCollection` con **12** municipios y geometrías `MultiPolygon`. Para comprobar el servicio de manera independiente, abrir `http://127.0.0.1:8000/docs` y probar `GET /municipios` en la documentación interactiva de FastAPI.

**Evidencia histórica de integración:** la Etapa 04 registró `GET /municipios` HTTP 200 en Chrome y doce municipios visibles en Leaflet (23 de octubre de 2026). Ese resultado demuestra el recorrido API-base-visor, pero no constituye una prueba automatizada del backend ni confirma por sí solo la reproducción de toda la base en otra máquina.

## 7. Qué se logró y qué no

Al cerrar esta etapa, el backend ya podía obtener los municipios reales desde PostGIS y publicarlos en una colección GeoJSON. Esa fue la condición previa necesaria para integrar Leaflet en la Etapa 04.

La versión actual del repositorio sí incluye el archivo completo `backend/main.py` con F1–F5. El documento de esta etapa se centra deliberadamente en el **primer servicio**, sin trasladar retrospectivamente las funcionalidades posteriores a la etapa inicial.

**Limitación de reproducibilidad:** los datos cargados y las contraseñas no están versionados; clonar el repositorio no crea por sí solo la geodatabase poblada.

**Continuación:** [Etapa 04 — consumo del GeoJSON desde Leaflet](etapa-04-f1-leaflet.md) · [Arquitectura](arquitectura.md) · [Especificación funcional vigente](funcionalidades.md).
