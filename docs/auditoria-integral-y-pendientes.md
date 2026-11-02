# Auditoría editorial y técnica del Laboratorio SIG Web

**Corte:** noviembre de 2026. **Ámbito:** repositorio `programacion-sig-web` (portal, ejercicios docentes, frontend, backend, SQL y guías). La revisión se realizó sobre el contenido versionado; no sobre la instalación local de PostgreSQL.

## Correcciones documentales realizadas

| Hallazgo | Acción |
|---|---|
| `etapa-01-geodatabase.md` contiene dos tablas, pero el visor utiliza cuatro | Se preservó como etapa histórica y se vinculó al [modelo vigente](modelo-geodatabase-final.md) |
| `modelo-ampliado-cuatro-tablas.md` aún afirmaba «no implementado» | Se añadió una advertencia explícita: es un documento de decisiones históricas, no estado actual |
| Guías iniciales F1–F3 hablan de backend local o pendiente | Se incorporaron advertencias que remiten a `backend/main.py` y evitan duplicar rutas |
| No existía una guía específica de F5 | Se creó [Etapa 08 — F5](etapa-08-f5-equipamientos.md) |
| El lector no tenía una ruta de consulta prioritaria | Se creó [guía principal del visor](guia-principal-visor.md) |
| Faltaba un resumen del esquema final | Se creó [modelo de geodatabase final](modelo-geodatabase-final.md) con alcance probatorio explícito |
| Había riesgo de confundir F4 con accesibilidad y F5 con contención geométrica | Ambas distinciones quedaron documentadas |

## Estado de evidencias

**Verificado en código versionado:** definición de endpoints F1–F5, configuración del backend desde `.env`, uso de Psycopg, SQL parametrizado, `ST_AsGeoJSON`, `ST_Area`, `ST_Covers`, `ST_DWithin`, `ST_Distance`; aplicación estática y módulos docentes publicados.

**Reportado y documentado a partir de sesiones docentes:** 12 municipios, 418 sedes educativas, 227 sedes de Salud, consultas funcionales en navegador y PowerShell.

**No verificado con acceso directo:** instancia PostgreSQL local, DDL físico completo de tablas añadidas, integridad estructural actual exacta, conjuntos originales completos, pruebas automatizadas del navegador, accesibilidad del sitio y compatibilidad de plugins/CDN externos.

## Pendientes técnicos — orden recomendado

1. **DDL de cuatro tablas:** extraer definición real de `tipo_equipamiento` y `equipamiento` mediante `pg_dump --schema-only` o consultas a catálogos PostgreSQL. No publicar DDL reconstruido a partir de suposiciones.
2. **Reproducibilidad:** publicar migración SQL y proceso de carga trazable de equipamientos, cuidando licencias y tamaños. Definir una muestra de datos reproducible si no es posible compartir los originales.
3. **Pruebas:** preparar pruebas de API para valores válidos, inválidos, respuestas vacías, errores de base, fronteras y distancias, y pruebas de navegación de frontend. Las evidencias actuales son manuales y puntuales.
4. **Seguridad:** revisar que secretos no estén en historial Git; las versiones originales de ruteo incluyen una clave LocationIQ que debe rotarse. Ninguna credencial debe aparecer en HTML/JS público.
5. **Consistencia pedagógica:** los módulos 01 y 02 contienen adaptaciones reconstruidas; mantener visible que no son una reproducción exacta de todos los originales. Revisar además el panel/menú de rutas y recursos locales.
6. **Material audiovisual:** publicar las diapositivas aprobadas en un directorio de recursos, indexadas por número y con texto alternativo; las imágenes no sustituyen SQL ni documentación verificable.

## Regla de mantenimiento

La **guía principal, el modelo final, las funcionalidades y el código vigente** constituyen referencia actual. Las **etapas 01–08** registran el proceso incremental y pueden mostrar fragmentos históricos con advertencia. Cualquier cambio de F1–F5 requiere actualizar contrato, guía, pruebas y material visual en el mismo ciclo de mantenimiento.

**Conclusión:** la inconsistencia documental de mayor impacto quedó señalada y corregida mediante una ruta de lectura vigente. La documentación aún **no puede considerarse plenamente reproducible** hasta auditar el DDL local y automatizar pruebas.
