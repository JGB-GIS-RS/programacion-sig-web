# Arquitectura funcional del piloto — GeoAlerta

> **Estado:** arquitectura conceptual de referencia, no implementación desplegada. 21 de octubre de 2026.

## Figura 01. Arquitectura funcional del piloto

```mermaid
flowchart TB
    subgraph ORIGEN["Captura ciudadana — distintos sectores y redes"]
        E1["Estudiante A<br/>Teléfono + navegador"]
        E2["Estudiante B<br/>Teléfono + navegador"]
        EN["Estudiante N<br/>Teléfono + navegador"]
    end

    subgraph CAPTURA["Interfaz móvil GeoAlerta — HTML, CSS, JavaScript y Leaflet"]
        F["Fotografía + categoría + descripción<br/>Ubicación del incidente revisable<br/>Consentimiento y envío"]
    end

    NET["Internet — HTTPS<br/>Solicitud autenticada"]
    subgraph SERVIDOR["Servidor central GeoAlerta"]
        API["API HTTP — FastAPI / Python<br/>Validación + identificador + permisos"]
        DB[("PostgreSQL / PostGIS<br/>Atributos + punto EPSG:4326 + estado")]
        IMG[("Almacenamiento protegido<br/>Fotografías y referencias")]
    end

    subgraph CONTROL["Centro de control — acceso autorizado"]
        DASH["Visor Leaflet<br/>Reportes, fotos, categorías y estados"]
        SYNC["Consulta periódica inicial<br/>WebSockets: extensión eventual"]
    end

    E1 --> F
    E2 --> F
    EN --> F
    F --> NET
    NET --> API
    API -->|"SQL geoespacial"| DB
    API -->|"Almacena/consulta con permisos"| IMG
    DB -->|"Incidencias y geometrías"| API
    IMG -->|"Referencias y acceso autorizado"| API
    API -->|"JSON / GeoJSON vía HTTPS"| SYNC
    SYNC --> DASH
```

**Lectura funcional.** Estudiantes en distintos sectores envían incidencias desde teléfonos y redes independientes. La aplicación solicita permiso de geolocalización, permite corregir el punto para representar el **incidente** (no necesariamente la vivienda o posición del reportante) y adjunta fotografía, categoría y descripción. El servidor valida las solicitudes, registra el punto y los metadatos en PostgreSQL/PostGIS y administra las fotografías en almacenamiento protegido. El centro de control consulta mediante API las incidencias autorizadas y las muestra en un mapa Leaflet.

## Componentes y responsabilidades

| Componente | Responsabilidad | Estado del piloto |
|---|---|---|
| Aplicación móvil web | Capturar foto, descripción, categoría, punto geográfico y autorización de envío | Por implementar |
| Red HTTPS | Proteger transporte y habilitar geolocalización en móviles | Por desplegar |
| API FastAPI | Validación de entrada, autenticación, creación/consulta, permisos y acuse de recepción | Por implementar |
| PostgreSQL/PostGIS | Persistencia de geometrías puntuales EPSG:4326, atributos y estados | Por implementar |
| Almacenamiento de fotos | Archivos con acceso controlado y referencias almacenadas en BD | Por implementar |
| Centro de control Leaflet | Visualizar y filtrar incidencias con sus fotos y estados | Por implementar |
| Actualización automática | Consultas periódicas iniciales; latencia a medir | Por implementar |

## Secuencia mínima de validación

1. Un estudiante, fuera o dentro del entorno de referencia, abre la interfaz a través de HTTPS y autoriza voluntariamente la geolocalización.
2. Registra una incidencia de prueba con fotografía, categoría, descripción y punto corregible en el mapa.
3. La API verifica la solicitud y crea un identificador; almacena los metadatos y geometría en PostGIS y gestiona la foto con permisos.
4. El centro de control obtiene la información mediante HTTPS y representa el reporte sin intervención manual sobre archivos.
5. Se repite desde varios dispositivos y redes para comprobar recepción, integridad espacial, acceso autorizado y latencia de actualización.

## Reglas de diseño que no deben perderse

- **No confundir localización del dispositivo con la del incidente.** El punto se debe poder revisar y corregir.
- **No divulgar viviendas ni coordenadas sensibles.** Las pruebas son voluntarias; no exigir reportar desde el domicilio.
- **No exponer secretos o acceso directo a la base de datos en el navegador.**
- **No interpretar la recepción como verificación institucional.** Distinguir reportes de prueba, reportes por verificar y estados posteriores.
- **No declarar «tiempo real» sin medición.** El piloto utilizará sondeo periódico inicialmente; WebSockets puede añadirse más adelante.
- **No ofrecer atención de emergencias.** Los incidentes de peligro inmediato deben utilizar canales oficiales.
- **No publicar imágenes identificables sin un tratamiento adecuado de privacidad, conservación y eliminación.**

## Delimitación docente

Este diagrama describe exclusivamente el **piloto GeoAlerta**, dentro de `proyectos/geoalerta/`. No modifica el geovisor municipal ni otros ejercicios del repositorio principal.

**Referencia:** [README del proyecto](../README.md).
