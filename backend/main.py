
import os
import json
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles


# ============================================
# 1. CARGAR CONFIGURACIÓN PRIVADA
# ============================================

RUTA_PROYECTO = Path(__file__).resolve().parent.parent
RUTA_ENV = RUTA_PROYECTO / ".env"

load_dotenv(RUTA_ENV)


# ============================================
# 2. CREAR APLICACIÓN FASTAPI
# ============================================

app = FastAPI(title="Programación SIG Web")


# ============================================
# 3. CONEXIÓN CON POSTGRESQL / POSTGIS
# ============================================

def conectar_bd():
    return psycopg.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        connect_timeout=5
    )


# ============================================
# 4. VERIFICAR EL SERVIDOR
# ============================================

@app.get("/salud")
def verificar_servidor():
    return {
        "estado": "operativo",
        "servicio": "Programación SIG Web"
    }


# ============================================
# F1. CONSULTAR LOS MUNICIPIOS
# ============================================

@app.get("/municipios")
def obtener_municipios():

    sql = """
        SELECT
            cod_municipio,
            nombre,
            ST_AsGeoJSON(geom) AS geometria
        FROM public.municipio
        ORDER BY cod_municipio;
    """

    try:
        with conectar_bd() as conexion:
            with conexion.cursor() as cursor:
                cursor.execute(sql)
                registros = cursor.fetchall()

    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail="No se pudo consultar la base de datos"
        )

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

    geojson = {
        "type": "FeatureCollection",
        "features": entidades
    }

    return JSONResponse(
        content=geojson,
        media_type="application/geo+json"
    )


# ============================================
# F2. CONSULTAR DETALLE MUNICIPAL
# ============================================

@app.get("/municipios/{codigo}")
def consultar_detalle_municipal(codigo: str):

    # Verificar que sea un código DIVIPOLA de 5 dígitos
    if (
        len(codigo) != 5
        or not codigo.isascii()
        or not codigo.isdigit()
    ):
        raise HTTPException(
            status_code=422,
            detail="El código debe contener cinco dígitos"
        )

    sql = """
        SELECT
            cod_municipio,
            nombre,
            ST_Area(geom::geography) / 1000000.0
                AS area_geodesica_km2
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
        raise HTTPException(
            status_code=404,
            detail="Municipio no encontrado"
        )

    return {
        "cod_municipio": registro[0],
        "nombre": registro[1],
        "area_geodesica_km2": round(registro[2], 2)
    }


# ============================================
# F3. IDENTIFICACIÓN ESPACIAL POR COORDENADAS
# ============================================

@app.get("/consultas/ubicacion")
def identificar_ubicacion(
    lon: float = Query(..., ge=-180, le=180),
    lat: float = Query(..., ge=-90, le=90)
):

    # Identificar los municipios que cubren el punto
    sql = """
        SELECT
            cod_municipio,
            nombre,
            ST_AsGeoJSON(geom) AS geometria
        FROM public.municipio
        WHERE ST_Covers(
            geom,
            ST_SetSRID(
                ST_MakePoint(%s, %s),
                4326
            )
        )
        ORDER BY cod_municipio;
    """

    try:
        with conectar_bd() as conexion:
            with conexion.cursor() as cursor:
                cursor.execute(sql, (lon, lat))
                registros = cursor.fetchall()

    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail="No se pudo ejecutar la consulta espacial"
        )

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

    geojson = {
        "type": "FeatureCollection",
        "features": entidades
    }

    return JSONResponse(
        content=geojson,
        media_type="application/geo+json"
    )


# ============================================
# 5. SERVIR EL GEOVISOR LEAFLET
# ============================================

CARPETA_FRONTEND = RUTA_PROYECTO / "frontend"

app.mount(
    "/static",
    StaticFiles(directory=str(CARPETA_FRONTEND)),
    name="static"
)


@app.get("/", include_in_schema=False)
def abrir_geovisor():
    return FileResponse(
        CARPETA_FRONTEND / "index.html"
    )


# ============================================
# F4. CONSULTA ESPACIAL DE PROXIMIDAD
# ============================================

@app.get("/consultas/proximidad")
def consultar_proximidad(
    lon: float = Query(..., ge=-180, le=180),
    lat: float = Query(..., ge=-90, le=90),
    radio_m: float = Query(..., gt=0, le=50000)
):

    sql = """
        WITH punto AS (
            SELECT ST_SetSRID(
                ST_MakePoint(%s, %s), 4326
            )::geography AS ubicacion
        )
        SELECT
            m.cod_municipio,
            m.nombre,
            ST_Distance(
                m.geom::geography,
                p.ubicacion
            ) AS distancia_metros
        FROM public.municipio AS m
        CROSS JOIN punto AS p
        WHERE ST_DWithin(
            m.geom::geography,
            p.ubicacion,
            %s
        )
        ORDER BY distancia_metros, m.cod_municipio;
    """

    try:
        with conectar_bd() as conexion:
            with conexion.cursor() as cursor:
                cursor.execute(
                    sql,
                    (lon, lat, radio_m)
                )
                registros = cursor.fetchall()

    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail="No se pudo ejecutar la consulta de proximidad"
        )

    resultados = []

    for codigo, nombre, distancia in registros:
        resultados.append({
            "cod_municipio": codigo,
            "nombre": nombre,
            "distancia_metros": round(distancia, 2)
        })

    return {
        "punto": {
            "lon": lon,
            "lat": lat
        },
        "radio_m": radio_m,
        "total": len(resultados),
        "municipios": resultados
    }
