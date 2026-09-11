# Programación SIG Web

Proyecto docente para construir, desde cero y con una arquitectura mínima pero técnicamente rigurosa, una aplicación SIG web basada en **PostgreSQL/PostGIS**, **FastAPI** y **Leaflet**.

## Objetivo general

Construir un visor geográfico web capaz de consultar datos espaciales almacenados en PostGIS mediante una API desarrollada con FastAPI y representarlos dinámicamente en Leaflet.

La prioridad del proyecto es comprender con claridad el flujo completo de datos:

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

## Principio de diseño

El proyecto adopta una arquitectura deliberadamente pequeña.

No se incorporarán tecnologías adicionales mientras no exista una necesidad técnica concreta que las justifique.

Por tanto, en la primera versión no se utilizarán:

- Docker
- React
- GeoServer
- ORM
- autenticación
- microservicios
- servicios en la nube
- WebSockets
- teselas vectoriales

La simplificación no implica pérdida de rigor: cada componente tendrá una responsabilidad explícita y verificable.

# Plan de trabajo

## 01 · Datos espaciales

### Objetivo
Disponer de una capa geográfica real, limpia y comprensible que pueda utilizarse durante todo el proyecto.

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

## 02 · PostgreSQL + PostGIS

### Objetivo
Almacenar las entidades geográficas dentro de una base de datos espacial y aprender a consultarlas.

### Actividades
- crear una base de datos PostgreSQL
- activar la extensión PostGIS
- importar la capa de municipios
- identificar la columna geométrica
- realizar consultas SQL básicas

### Consultas iniciales
```sql
SELECT * FROM municipios;
```

```sql
SELECT nombre FROM municipios;
```

```sql
SELECT nombre
FROM municipios
WHERE nombre = 'Armenia';
```

```sql
SELECT nombre, ST_GeometryType(geom)
FROM municipios;
```

### Resultado esperado
Una tabla espacial correctamente almacenada y consultable.

## 03 · FastAPI

### Objetivo
Construir el backend que actúe como intermediario entre el navegador y PostGIS.

### Conceptos mínimos
- URL
- endpoint
- petición HTTP
- respuesta HTTP

### Primer endpoint
```text
GET /municipios
```

FastAPI recibirá la petición, consultará PostGIS y preparará la respuesta.

### Resultado esperado
Una API funcional capaz de recuperar los municipios almacenados en PostGIS.

## 04 · HTTP + GeoJSON

### Objetivo
Comprender cómo se intercambia la información geográfica entre backend y frontend.

GeoJSON no constituye una nueva capa del sistema: es el **formato de intercambio** utilizado para enviar geometrías y atributos al navegador.

```text
PostGIS
   ↓
FastAPI
   ↓
GeoJSON
   ↓
JavaScript
```

Estructura general:

```json
{
  "type": "FeatureCollection",
  "features": []
}
```

### Resultado esperado
Un endpoint que entregue una colección GeoJSON válida.

## 05 · JavaScript + Leaflet

### Objetivo
Consumir desde el navegador la información publicada por FastAPI y representarla cartográficamente.

```javascript
fetch("http://localhost:8000/municipios")
```

```javascript
L.geoJSON(datos).addTo(map);
```

### Resultado esperado
Los municipios del Quindío visibles en un mapa interactivo.

Primer hito principal:

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

## 06 · Interacción y consulta espacial

### Objetivo
Permitir que las acciones realizadas por el usuario en el mapa generen consultas sobre los datos almacenados en PostGIS.

### Primera interacción
Al seleccionar un municipio se podrán mostrar atributos como:
- nombre
- código DANE
- área

### Consulta parametrizada
```text
GET /municipios/63001
```

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
Una vez dominado el flujo completo se incorporará una única operación espacial sencilla, por ejemplo:

> Identificar los municipios que se encuentran a una distancia determinada de un punto seleccionado en el mapa.

Para consultas de proximidad se priorizará, cuando corresponda:

```sql
ST_DWithin()
```

### Resultado esperado
Una consulta espacial ejecutada en PostGIS a partir de una interacción realizada en Leaflet.

# Hitos del proyecto

1. PostGIS contiene los municipios del Quindío.
2. FastAPI puede consultar PostGIS.
3. FastAPI devuelve GeoJSON válido.
4. Leaflet consume la API y dibuja los municipios.
5. El usuario selecciona o filtra información desde el visor.
6. Una interacción en Leaflet desencadena una consulta espacial en PostGIS.

# Estructura mínima del proyecto

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

No se crearán archivos o módulos adicionales hasta que aparezca una responsabilidad que justifique su separación.

# Pregunta transversal

> **¿Cómo llega una geometría almacenada en PostGIS hasta convertirse en un objeto interactivo dentro de un mapa web?**

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

Y el recorrido inverso comienza cuando el usuario interactúa:

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

# Filosofía del ejercicio

La meta inicial no es construir un visor visualmente complejo.

La primera meta técnica es conseguir que **una geometría almacenada en PostGIS viaje correctamente hasta Leaflet**.

Cuando ese flujo funcione, la arquitectura fundamental estará completa. Todo lo demás será una ampliación controlada del sistema.
