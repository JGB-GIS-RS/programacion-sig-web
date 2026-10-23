# Etapa 05 — F2: consulta remota de detalle municipal

**Curso:** Programación para SIG  
**Estado (23 de octubre de 2026): primera prueba visual de F2 positiva en el computador del docente.** El popup de Armenia (DIVIPOLA 63001) mostró **121,17 km²** de superficie geodésica calculada tras pulsar «Consultar detalle». **Aún no se ha aportado captura de la petición individual en Chrome DevTools**: la captura disponible de Network muestra únicamente la carga F1 (`municipios`, HTTP 200). F2 no se considera completamente auditada hasta comprobar `GET /municipios/63001` con HTTP 200 y la respuesta JSON.

## 1. Diferencia conceptual entre F1 y F2

- **F1:** clic sobre un polígono → popup con `nombre` y `cod_municipio` de la `FeatureCollection` cargada previamente. No dispara SQL nuevo.
- **F2:** pulsar **Consultar detalle** → `fetch("/municipios/63001")` → FastAPI → consulta SQL parametrizada a PostGIS → devuelve una respuesta JSON con la **superficie geodésica calculada**, que no estaba en los atributos descargados en F1.

No llamamos «consulta espacial remota» al popup de F1. Tampoco confundimos la superficie de una geometría determinada con una cifra oficial de área municipal.

## 2. Archivos del frontend

- [`frontend/app.js`](../frontend/app.js): mantiene F1 y añade la solicitud explícita para el botón F2.
- [`frontend/index.html`](../frontend/index.html): descripción actualizada de F1 y F2.
- [`frontend/style.css`](../frontend/style.css): presentación del botón y del resultado en el popup.

No se modifica el contrato del endpoint existente `GET /municipios`, ni el contenido de la geodatabase.

## 3. Añadir el endpoint al backend local

**Importante:** `backend/main.py` ya funciona en el equipo del docente, pero sigue siendo local y no está versionado en GitHub. No sobrescribir ese archivo mediante una versión genérica. Recuperar el frontend con `git pull origin main`, y añadir **al final** de `backend/main.py` este código (puede ir después de la ruta `/`):

```python
# F2 — Consultar datos adicionales de un municipio.
@app.get("/municipios/{codigo}")
def consultar_detalle_municipal(codigo: str):

    # Código DIVIPOLA de cinco dígitos, conservado como texto.
    if len(codigo) != 5 or not codigo.isascii() or not codigo.isdigit():
        raise HTTPException(
            status_code=422,
            detail="El código municipal debe contener cinco dígitos"
        )

    sql = """
        SELECT
            cod_municipio,
            nombre,
            ST_Area(geom::geography) / 1000000.0 AS area_geodesica_km2
        FROM public.municipio
        WHERE cod_municipio = %s;
    """

    try:
        with conectar_bd() as conexion:
            with conexion.cursor() as cursor:
                cursor.execute(sql, (codigo,))
                registro = cursor.fetchone()
    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail="No se pudo consultar la base de datos"
        )

    if registro is None:
        raise HTTPException(status_code=404, detail="Municipio no encontrado")

    return {
        "cod_municipio": registro[0],
        "nombre": registro[1],
        "area_geodesica_km2": round(registro[2], 2)
    }
```

**Dependencias existentes:** `app = FastAPI(...)`, `conectar_bd()`, `psycopg` y `HTTPException` deben existir, como en el backend local probado. Si falta `HTTPException`, incorporarlo a los imports: `from fastapi import FastAPI, HTTPException`.

**Parámetros:** `cursor.execute(sql, (codigo,))` es una consulta parametrizada; la coma de la tupla de un elemento importa. No interpolar códigos del usuario directamente dentro de SQL.

**Área:** `ST_Area(geom::geography)` expresa superficie en metros cuadrados, calculada geodésicamente a partir de la geometría. Dividir por 1 000 000 produce km². El valor depende de la geometría y la configuración de PostGIS; es un cálculo, no un valor de área DANE asumido.

## 4. Pruebas desde PowerShell

Guardar `main.py` y dejar Uvicorn ejecutándose con `--reload`. Consultar:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/municipios/63001
```

**Esperado:** JSON con `cod_municipio: "63001"`, `nombre: "ARMENIA"` y un número positivo en `area_geodesica_km2` (no inventar valores).

Comprobar también:

- `/municipios/63999` → HTTP 404 si el código no existe.
- `/municipios/abc` → HTTP 422 por código mal formado.
- `/municipios` → sigue entregando las 12 entidades F1.

## 5. Pruebas en el navegador

1. Abrir `http://127.0.0.1:8000/`, comprobar 12 polígonos (F1).
2. En DevTools → Network → Fetch/XHR, limpiar las solicitudes anteriores.
3. Hacer clic en Armenia: aparece el popup local, **sin una nueva petición de detalle**.
4. Pulsar **Consultar detalle**: aparece `municipios/63001` con **HTTP 200**.
5. Leer la superficie calculada en km², que proviene del JSON de FastAPI.
6. Repetir con otro municipio; verificar que la URL y el dato corresponden al código seleccionado.
7. Desconectar temporalmente la API solo si se necesita probar errores; la interfaz debe informar el fallo sin atribuir un valor falso.

**F2 no se declara validada hasta completar estas verificaciones y registrar la evidencia.**

## 6. Continuidad

F3 utilizará un clic sobre el mapa para construir un punto geográfico y ejecutar `ST_Covers` en PostGIS. F4 utilizará un radio definido por el usuario y `ST_DWithin`; ambas funcionalidades conservan el diseño del ejercicio municipal original.

La [ampliación de cuatro tablas con equipamientos](modelo-ampliado-cuatro-tablas.md) sigue aprobada a nivel de diseño y se implementará posteriormente con su propia fuente y auditoría.

## 7. Evidencia visual preliminar recibida

- Popup sobre ARMENIA, código DIVIPOLA **63001**, con botón **Consultar detalle**.
- Respuesta representada por el popup: **«Superficie geodésica calculada: 121,17 km²»**.
- Chrome Network: petición **`municipios`**, HTTP **200**, tipo `fetch`, desde `app.js:100`, con **5.228 kB** y **509 ms** indicados para la carga general F1.
- **Precaución:** estos valores de tiempo y tamaño corresponden a `GET /municipios`, no a la consulta individual. Las capturas no permiten inferir rendimiento de F2 ni acreditar todavía el HTTP 200 del endpoint `/municipios/63001`.

**Prueba final pendiente:** con DevTools → Network → Fetch/XHR abierto, limpiar la lista, pulsar «Consultar detalle» y verificar la nueva entrada `municipios/63001`, su estado **200**, y el JSON de respuesta. Esta distinción es esencial en el propósito docente de F2.
