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
- sistema de referencia de coordenadas
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

Almacenar las entidades geográficas dentro de una base de datos espacial y realizar consultas sobre sus atributos y geometrías.

### Actividades

- crear una base de datos PostgreSQL
- activar la extensión PostGIS
- importar la capa de municipios
- identificar la columna geométrica
- realizar consultas SQL básicas

### Consultas iniciales

```sql
SELECT *
FROM municipios;
```

```sql
SELECT nombre
FROM municipios;
```

```sql
SELECT nombre
FROM municipios
WHERE nombre = 'Armenia';
```

Comprobación de geometría:

```sql
SELECT
    nombre,
    ST_GeometryType(geom)
FROM municipios;
```

### Resultado esperado

Una tabla espacial correctamente almacenada y consultable.

---

## 03 · FastAPI

### Objetivo

Construir el backend encargado de recibir las solicitudes del frontend, consultar PostGIS y devolver los resultados.

### Conceptos principales

- URL
- endpoint
- petición HTTP
- respuesta HTTP

### Primer endpoint

```text
GET /municipios
```

FastAPI recibirá la petición, ejecutará la consulta sobre PostGIS y preparará la respuesta.

### Resultado esperado

Una API funcional capaz de recuperar los municipios almacenados en PostGIS.

---

## 04 · HTTP + GeoJSON

### Objetivo

Definir el intercambio de información geográfica entre el backend y el frontend.

GeoJSON será el formato utilizado para transferir geometrías y atributos desde FastAPI hacia el navegador.

```text
PostGIS
   ↓
FastAPI
   ↓
GeoJSON
   ↓
JavaScript
```

La respuesta tendrá una estructura general de este tipo:

```json
{
  "type": "FeatureCollection",
  "features": []
}
```

### Resultado esperado

Un endpoint que entregue una colección GeoJSON válida.

---

## 05 · JavaScript + Leaflet

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

## 06 · Interacción y consulta espacial

### Objetivo

Permitir que las acciones realizadas por el usuario en el mapa generen consultas sobre los datos almacenados en PostGIS.

### Primera interacción

Al seleccionar un municipio se podrán consultar atributos como:

- nombre
- código DANE
- área

### Consulta parametrizada

Ejemplo:

```text
GET /municipios/63001
```

Flujo:

```text
USUARIO
   ↓
Leaflet
   ↓
HTTP
   ↓
FastAPI
   ↓
SQL
   ↓
PostGIS
```

### Primera consulta espacial

Una vez implementado el flujo completo, se incorporará una operación espacial, por ejemplo:

> Identificar los municipios que se encuentran a una distancia determinada de un punto seleccionado en el mapa.

Para consultas de proximidad se podrá utilizar:

```sql
ST_DWithin()
```

### Resultado esperado

Una consulta espacial ejecutada en PostGIS a partir de una interacción realizada en Leaflet.

# Hitos del ejercicio

1. PostGIS contiene los municipios del Quindío.
2. FastAPI puede consultar PostGIS.
3. FastAPI devuelve GeoJSON válido.
4. Leaflet consume la API y representa los municipios.
5. El usuario selecciona o filtra información desde el visor.
6. Una interacción en Leaflet desencadena una consulta espacial en PostGIS.

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

# Criterio de implementación

La primera meta técnica es conseguir que una geometría almacenada en PostGIS sea consultada mediante FastAPI, transferida como GeoJSON y representada correctamente en Leaflet.

Una vez verificado este flujo, se incorporarán progresivamente mecanismos de interacción y consulta espacial sobre la misma arquitectura.
