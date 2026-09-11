# Programación SIG Web

Ejercicio de clase para construir la arquitectura de una aplicación SIG web basada en **PostgreSQL/PostGIS**, **FastAPI** y **Leaflet**.

## Objetivo general

Construir un visor geográfico web capaz de consultar datos espaciales almacenados en PostGIS mediante una API desarrollada con FastAPI y representarlos dinámicamente en Leaflet.

La aplicación se estructura a partir de la interacción entre el frontend, el backend y la base de datos espacial:

```text
USUARIO
   ↓
FRONTEND
HTML + CSS + JavaScript + Leaflet
   ↓
HTTP / API
   ↓
BACKEND
FastAPI + Python
   ↓
SQL
   ↓
PostgreSQL + PostGIS
```

La respuesta realiza el recorrido inverso:

```text
PostGIS
   ↓
resultado SQL
   ↓
FastAPI
   ↓
GeoJSON
   ↓
Leaflet
   ↓
MAPA EN PANTALLA
```

# Plan de trabajo

## 01 · Datos espaciales

### Objetivo

Disponer de una capa geográfica real, limpia y comprensible que pueda utilizarse durante todo el ejercicio.

### Datos iniciales

**Municipios del departamento del Quindío, Colombia.**

### Aspectos a revisar

- geometría
- atributos
- sistema de referencia, unidades y transformación requerida para publicación web
- calidad básica de los datos

### Concepto central

```text
GEOMETRÍA + ATRIBUTOS + SISTEMA DE REFERENCIA
```

### Resultado esperado

Una capa de municipios revisada y lista para ser almacenada en PostGIS.

---

## 02 · PostgreSQL + PostGIS

### Objetivo

Diseñar e implementar la base de datos geográfica y realizar consultas sobre sus atributos y geometrías.

### 2.1 · Modelo conceptual

Identificar las entidades del problema, sus propiedades y las relaciones entre ellas, sin depender todavía de una tecnología concreta.

Ejemplo inicial:

```text
DEPARTAMENTO
     │
     │ contiene
     ▼
MUNICIPIO
```

### 2.2 · Modelo lógico

Traducir el modelo conceptual a una estructura formal de entidades, atributos, claves y relaciones.

Ejemplo:

```text
DEPARTAMENTO
-------------------------
cod_departamento   PK
nombre

MUNICIPIO
-------------------------
cod_municipio      PK
nombre
area_km2
cod_departamento   FK
geom

DEPARTAMENTO 1 ───── N MUNICIPIO
```

### 2.3 · Modelo físico

Definir la implementación concreta en PostgreSQL/PostGIS: nombres de tablas y columnas, tipos de datos, claves, restricciones, tipo geométrico, SRID e índices espaciales cuando correspondan.

Ejemplo:

```sql
CREATE TABLE departamento (
    cod_departamento varchar(2) PRIMARY KEY,
    nombre varchar(100) NOT NULL
);
```

```sql
CREATE TABLE municipio (
    cod_municipio varchar(5) PRIMARY KEY,
    nombre varchar(100) NOT NULL,
    area_km2 numeric,
    cod_departamento varchar(2),
    geom geometry(MultiPolygon, 4326),
    FOREIGN KEY (cod_departamento)
        REFERENCES departamento(cod_departamento)
);
```

### 2.4 · Implementación en PostgreSQL/PostGIS

- crear la base de datos PostgreSQL
- activar la extensión PostGIS
- crear las tablas definidas en el modelo físico
- cargar la información geográfica
- verificar la columna geométrica y el sistema de referencia

### 2.5 · Consultas SQL y espaciales

Realizar consultas que permitan comprobar tanto la estructura del modelo como el contenido almacenado.

Consultas iniciales:

```sql
SELECT *
FROM municipio;
```

```sql
SELECT nombre
FROM municipio;
```

```sql
SELECT nombre
FROM municipio
WHERE nombre = 'Armenia';
```

Comprobación de geometría:

```sql
SELECT
    nombre,
    ST_GeometryType(geom)
FROM municipio;
```

### Resultado esperado

Una base de datos geográfica diseñada, implementada y verificable mediante consultas SQL y espaciales.

---

## 03 · FastAPI + GeoJSON

### Objetivo

Construir el backend encargado de recibir las solicitudes del frontend, consultar PostGIS y devolver los resultados mediante HTTP en formato GeoJSON.

### Conceptos principales

- URL
- endpoint
- petición HTTP
- respuesta HTTP
- GeoJSON

### Primer endpoint

```text
GET /municipios
```

El flujo será:

```text
PostGIS
   ↓
consulta SQL
   ↓
FastAPI
   ↓
respuesta HTTP
   ↓
GeoJSON
```

La respuesta tendrá una estructura general de este tipo:

```json
{
  "type": "FeatureCollection",
  "features": []
}
```

### Resultado esperado

Un endpoint operativo capaz de consultar PostGIS y entregar una colección GeoJSON válida.

---

## 04 · JavaScript + Leaflet

### Objetivo

Consumir desde el navegador la información publicada por FastAPI y representarla cartográficamente mediante Leaflet.

El frontend realizará una petición al backend:

```javascript
fetch("http://localhost:8000/municipios")
```

y Leaflet incorporará la respuesta GeoJSON al mapa:

```javascript
L.geoJSON(datos).addTo(map);
```

### Resultado esperado

Los municipios del Quindío visibles en un mapa interactivo.

El flujo completo será:

```text
PostGIS
   ↓
FastAPI
   ↓
GeoJSON
   ↓
Leaflet
   ↓
MAPA
```

---

## 05 · Interacción

### Objetivo

Incorporar mecanismos de interacción en el visor y distinguir entre operaciones resueltas localmente en el navegador y consultas que requieren acceder nuevamente al servidor.

### Interacción local

Al seleccionar un municipio, Leaflet podrá mostrar atributos que ya hayan sido cargados con el GeoJSON, por ejemplo:

- nombre
- código DANE
- área

```text
clic
   ↓
Leaflet
   ↓
atributos ya cargados
   ↓
popup
```

### Consulta al servidor

Cuando se requiera información específica no disponible localmente, el frontend podrá realizar una nueva petición.

Ejemplo:

```text
GET /municipios/63001
```

Flujo:

```text
selección
   ↓
Leaflet
   ↓
HTTP
   ↓
FastAPI
   ↓
PostGIS
   ↓
respuesta
```

### Resultado esperado

Un visor capaz de resolver interacciones locales y realizar consultas parametrizadas al backend cuando sea necesario.

---

## 06 · Consulta espacial

### Objetivo

Ejecutar una consulta espacial en PostGIS a partir de una interacción realizada por el usuario en el mapa.

### Consulta propuesta

Identificar los municipios que se encuentran a una distancia determinada de un punto seleccionado en el mapa.

```text
clic en el mapa
      ↓
Leaflet
      ↓
coordenadas
      ↓
HTTP
      ↓
FastAPI
      ↓
consulta espacial
      ↓
PostGIS
      ↓
GeoJSON
      ↓
Leaflet
```

Para consultas de proximidad se podrá utilizar:

```sql
ST_DWithin()
```

Las operaciones métricas deberán ejecutarse en un sistema de referencia adecuado o mediante tipos espaciales que preserven correctamente las unidades de distancia.

### Resultado esperado

Una consulta espacial ejecutada en PostGIS y representada nuevamente en Leaflet.

# Hitos del ejercicio

1. **Datos almacenados y consultables en PostGIS.**
2. **Endpoint `/municipios` operativo y con respuesta GeoJSON válida.**
3. **Municipios representados en Leaflet.**
4. **Interacción local y consulta parametrizada desde el visor.**
5. **Consulta espacial iniciada desde el mapa y resuelta en PostGIS.**

# Estructura del proyecto

```text
programacion-sig-web/
│
├── README.md
│
├── datos/
│
├── backend/
│   └── main.py
│
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

La estructura podrá ampliarse a medida que aparezcan nuevas responsabilidades dentro de la aplicación.

# Pregunta transversal

> **¿Cómo llega una geometría almacenada en PostGIS hasta convertirse en un objeto interactivo dentro de un mapa web?**

El recorrido principal es:

```text
DATOS
  ↓
PostGIS
  ↓
SQL
  ↓
FastAPI
  ↓
HTTP + GeoJSON
  ↓
JavaScript
  ↓
Leaflet
  ↓
MAPA
```

Y el recorrido inverso comienza cuando el usuario interactúa con el visor:

```text
USUARIO
  ↓
Leaflet
  ↓
petición HTTP
  ↓
FastAPI
  ↓
consulta SQL / espacial
  ↓
PostGIS
```

Al incorporar interacción, aparece una segunda pregunta:

> **¿Qué debe resolverse en el navegador y qué debe solicitarse al servidor?**

# Criterio de implementación

La primera meta técnica es conseguir que una geometría almacenada en PostGIS sea consultada mediante FastAPI, transferida como GeoJSON y representada correctamente en Leaflet.

Una vez verificado este flujo, se incorporarán progresivamente mecanismos de interacción y consulta espacial sobre la misma arquitectura.

# Glosario de conceptos

**API (Application Programming Interface):** interfaz que define cómo se comunican dos aplicaciones o componentes de software mediante solicitudes y respuestas estructuradas.

**Endpoint:** dirección específica dentro de una API que permite acceder a un recurso o ejecutar una operación determinada.

**Frontend:** parte de la aplicación con la que interactúa el usuario. En este ejercicio está compuesta principalmente por HTML, CSS, JavaScript y Leaflet.

**Backend:** componente encargado de recibir solicitudes, ejecutar la lógica de la aplicación, consultar la base de datos y devolver respuestas al frontend.

**HTTP (Hypertext Transfer Protocol):** protocolo utilizado para intercambiar solicitudes y respuestas entre el frontend y el backend.

**GeoJSON:** formato basado en JSON utilizado para representar y transferir entidades geográficas con sus geometrías y atributos.

**PostgreSQL:** sistema gestor de bases de datos relacional utilizado para almacenar y administrar la información de la aplicación.

**PostGIS:** extensión espacial de PostgreSQL que incorpora tipos de geometría, funciones espaciales e índices especializados.

**FastAPI:** framework de Python utilizado para construir el backend y exponer la API de la aplicación.

**Leaflet:** biblioteca JavaScript utilizada para crear mapas web interactivos y representar información geográfica en el navegador.

**SQL (Structured Query Language):** lenguaje utilizado para consultar, insertar, actualizar y administrar información almacenada en bases de datos relacionales.

**CRS (Coordinate Reference System):** sistema de referencia de coordenadas que define cómo se localizan espacialmente las coordenadas de una geometría.

**SRID (Spatial Reference System Identifier):** identificador numérico utilizado en bases de datos espaciales para asociar una geometría con un sistema de referencia específico.

**Geometría:** representación espacial de una entidad geográfica mediante puntos, líneas, polígonos u otros tipos geométricos.

**Atributo:** información descriptiva asociada a una entidad geográfica y almacenada junto con su geometría.

