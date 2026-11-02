# Etapa 08 — F5: equipamientos por municipio y categoría

**Estado vigente:** implementado en `backend/main.py` y `frontend/app.js` en noviembre de 2026.

## 1. Pregunta

**¿Qué sedes educativas o de salud están registradas en un municipio elegido?**

El usuario selecciona un municipio y una categoría y pulsa «Mostrar equipamientos». A diferencia de F4, no elige una distancia o un punto de búsqueda.

## 2. Recorrido

1. El frontend obtiene el código DIVIPOLA de cinco dígitos del selector y el tipo: `1` Educativo, `2` Salud.
2. JavaScript solicita `GET /equipamientos/municipio/{codigo}?tipo=...` con `fetch()`.
3. FastAPI valida los valores; Psycopg ejecuta SQL parametrizado sobre `public.equipamiento`.
4. El backend produce una `FeatureCollection` GeoJSON.
5. Leaflet dibuja los puntos de la categoría, aplica simbología diferenciada y permite consultar sus atributos.

## 3. SQL del backend

```sql
SELECT
    e.id_equipamiento,
    e.nombre,
    e.codigo_fuente,
    e.direccion,
    ST_AsGeoJSON(e.geom) AS geometria
FROM public.equipamiento AS e
WHERE e.cod_municipio = %s
  AND e.id_tipo = %s
ORDER BY e.nombre, e.id_equipamiento;
```

Los marcadores `%s` se suministran mediante `cursor.execute(sql, (codigo, tipo))`. No se concatenan los datos del usuario al texto SQL.

**Punto conceptual:** `WHERE cod_municipio = ...` aplica un **filtro administrativo por atributos**. No ejecuta `ST_Covers`, `ST_Within` ni otra validación de contención espacial. `ST_AsGeoJSON` convierte la geometría para su visualización: no calcula la pertenencia municipal.

## 4. Contrato HTTP

```text
GET /equipamientos/municipio/63001?tipo=2
```

- `codigo`: cinco dígitos ASCII, de lo contrario HTTP 422.
- `tipo`: 1 o 2 (si se omite, el backend usa 1); valores fuera del intervalo devuelven HTTP 422.
- Respuesta de éxito: HTTP 200, `application/geo+json`, objeto `FeatureCollection` con `Point`.
- Cada Feature contiene `id_equipamiento`, `nombre`, `codigo_fuente`, `direccion` e `id_tipo`, además de su geometría.
- Si el filtro no encuentra filas, devuelve una colección vacía, no necesariamente HTTP 404.
- Error de consulta PostgreSQL capturado: HTTP 503.

## 5. Datos y pruebas

En la instalación docente se observaron para Armenia (`63001`) **112 educativos** y **193 de salud**. Son resultados del conjunto integrado, no censos exhaustivos ni valores garantizados en otra instalación.

Prueba local:

```powershell
$r = Invoke-RestMethod 'http://127.0.0.1:8000/equipamientos/municipio/63001?tipo=2'
$r.type
$r.features.Count
```

Confirmar también el resultado en el navegador (petición en Network, puntos y atributos visibles) y comparar un conteo con SQL:

```sql
SELECT COUNT(*)
FROM public.equipamiento
WHERE cod_municipio = '63001' AND id_tipo = 2;
```

El botón «Ocultar equipamientos» remueve la capa temporal del mapa; **no elimina filas** de PostgreSQL.

## 6. Interpretación y límites

Las sedes son puntos de origen administrativo, no necesariamente ubicaciones comprobadas en campo. `estado` permanece «Sin verificar». No confundir establecimiento de salud con urgencias u hospital; tampoco equipamiento registrado con servicio accesible.

F4 encuentra puntos a distancia geodésica directa de una ubicación, con independencia de su municipio. F5 filtra por asignación municipal y tipo, sin calcular distancias ni comprobar contención geométrica.

**Código de referencia:** [backend](../backend/main.py) · [frontend](../frontend/app.js) · [modelo vigente](modelo-geodatabase-final.md) · [funcionalidades](funcionalidades.md).
