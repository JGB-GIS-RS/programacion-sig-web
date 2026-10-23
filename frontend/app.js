"use strict";

// F1: GeoJSON; F2: detalle municipal; F3: identificación espacial por clic.
const mapa = L.map("mapa").setView([4.5, -75.7], 9);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; colaboradores de OpenStreetMap"
}).addTo(mapa);

const estado = document.getElementById("estado");
const contador = document.getElementById("total");
const botonCentrar = document.getElementById("centrar");
const botonIdentificar = document.getElementById("identificar");
const estadoIdentificacion = document.getElementById("estado-identificacion");
const resultadoIdentificacion = document.getElementById("resultado-identificacion");

let municipios = null;
let modoIdentificar = false;
let capaCoincidencias = null;
let marcadorConsulta = null;
let solicitudUbicacionActual = 0;

const estilo = {
  color: "#00776f", weight: 2,
  fillColor: "#58b8a0", fillOpacity: 0.35
};

// F2: solo esta función realiza una nueva petición por municipio.
async function consultarDetalle(codigo, resultado, boton) {
  boton.disabled = true;
  resultado.textContent = "Consultando PostGIS...";

  try {
    const respuesta = await fetch(
      "/municipios/" + encodeURIComponent(codigo),
      { headers: { Accept: "application/json" } }
    );

    if (respuesta.status === 404) {
      throw new Error("Municipio no encontrado en la base de datos");
    }
    if (!respuesta.ok) {
      throw new Error("La API respondió con HTTP " + respuesta.status);
    }

    const datos = await respuesta.json();
    const area = Number(datos.area_geodesica_km2);

    if (datos.area_geodesica_km2 == null || !Number.isFinite(area)) {
      throw new Error("La respuesta no contiene una superficie válida");
    }

    const formato = new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    resultado.textContent =
      "Superficie geodésica calculada: " + formato.format(area) + " km²";

  } catch (error) {
    console.error("Fallo en consulta de detalle:", error);
    resultado.textContent = "No fue posible consultar el detalle: " + error.message;
  } finally {
    boton.disabled = false;
  }
}

// Un clic sobre el polígono muestra atributos LOCALES (F1).
// Solo el botón del popup realiza una nueva consulta HTTP (F2).
function prepararMunicipio(feature, capa) {
  const atributos = feature.properties || {};
  const codigoMunicipio = String(atributos.cod_municipio || "");

  // TextContent evita interpretar atributos de datos como HTML.
  const contenido = document.createElement("div");
  const titulo = document.createElement("strong");
  titulo.textContent = String(atributos.nombre || "Municipio");

  const codigo = document.createElement("p");
  codigo.textContent = "Código DIVIPOLA: " + (codigoMunicipio || "—");

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton-detalle";
  boton.textContent = "Consultar detalle";
  boton.disabled = !/^[0-9]{5}$/.test(codigoMunicipio);

  const resultado = document.createElement("p");
  resultado.className = "resultado-detalle";
  resultado.setAttribute("aria-live", "polite");
  resultado.textContent = "La superficie todavía no se ha consultado.";

  boton.addEventListener("click", () => {
    consultarDetalle(codigoMunicipio, resultado, boton);
  });

  contenido.append(titulo, codigo, boton, resultado);
  L.DomEvent.disableClickPropagation(contenido);
  // Guardar contenido: durante F3 se desactiva el popup, pero F2 se recupera.
  capa.contenidoPopupLocal = contenido;
  capa.bindPopup(contenido);

  capa.on("mouseover", () => capa.setStyle({ weight: 3, fillOpacity: 0.55 }));
  capa.on("mouseout", () => municipios.resetStyle(capa));
}


// F3: limpia las capas y anotaciones creadas por una consulta espacial.
function limpiarIdentificacion() {
  if (capaCoincidencias) {
    mapa.removeLayer(capaCoincidencias);
    capaCoincidencias = null;
  }
  if (marcadorConsulta) {
    mapa.removeLayer(marcadorConsulta);
    marcadorConsulta = null;
  }
}

// Alternar modos para que F1/F2 y F3 no compitan por el mismo clic.
function cambiarModoIdentificacion() {
  if (!municipios) return;

  modoIdentificar = !modoIdentificar;
  solicitudUbicacionActual += 1; // Invalidar respuestas HTTP anteriores.
  mapa.closePopup();

  municipios.eachLayer(capa => {
    if (modoIdentificar) {
      capa.unbindPopup();
    } else if (capa.contenidoPopupLocal) {
      capa.bindPopup(capa.contenidoPopupLocal);
    }
  });

  botonIdentificar.setAttribute("aria-pressed", String(modoIdentificar));
  botonIdentificar.textContent = modoIdentificar
    ? "Finalizar identificación"
    : "Identificar ubicación";
  botonIdentificar.classList.toggle("activo", modoIdentificar);
  mapa.getContainer().classList.toggle("modo-identificar", modoIdentificar);

  limpiarIdentificacion();
  if (modoIdentificar) {
    estadoIdentificacion.textContent = "Modo activo: haz clic en cualquier punto del mapa.";
    resultadoIdentificacion.textContent =
      "Se consultará PostGIS para identificar los municipios que cubren el punto.";
  } else {
    estadoIdentificacion.textContent = "Modo de identificación desactivado.";
    resultadoIdentificacion.textContent =
      "Selecciona un municipio para usar F1 y F2, o vuelve a activar F3.";
  }
}

// F3: enviar lon/lat al servidor; NO calcular contención en el navegador.
async function identificarUbicacion(latlng) {
  const idSolicitud = ++solicitudUbicacionActual;
  limpiarIdentificacion();

  marcadorConsulta = L.circleMarker(latlng, {
    radius: 6,
    color: "#8f2359",
    weight: 3,
    fillColor: "#ffffff",
    fillOpacity: 1,
    interactive: false
  }).addTo(mapa);

  const lon = latlng.lng;
  const lat = latlng.lat;
  estadoIdentificacion.textContent =
    "Longitud: " + lon.toFixed(5) + " · Latitud: " + lat.toFixed(5);
  resultadoIdentificacion.textContent = "Consultando relaciones espaciales en PostGIS...";

  const parametros = new URLSearchParams({
    lon: String(lon),
    lat: String(lat)
  });

  try {
    const respuesta = await fetch("/consultas/ubicacion?" + parametros.toString(), {
      headers: { Accept: "application/geo+json" }
    });
    if (!respuesta.ok) {
      throw new Error("La API respondió con HTTP " + respuesta.status);
    }
    const datos = await respuesta.json();
    if (datos.type !== "FeatureCollection" || !Array.isArray(datos.features)) {
      throw new Error("La respuesta no es una FeatureCollection válida");
    }

    // Puede haber otro clic más reciente, o el usuario puede haber salido de F3.
    if (!modoIdentificar || idSolicitud !== solicitudUbicacionActual) return;

    if (datos.features.length === 0) {
      resultadoIdentificacion.textContent =
        "Ningún municipio del conjunto de estudio cubre este punto.";
      return;
    }

    capaCoincidencias = L.geoJSON(datos, {
      interactive: false,
      style: {
        color: "#d16b24", weight: 4,
        fillColor: "#f4b95d", fillOpacity: 0.27
      }
    }).addTo(mapa);

    marcadorConsulta.bringToFront();

    const nombres = datos.features.map(entidad => {
      const propiedades = entidad.properties || {};
      return String(propiedades.nombre || "Municipio") +
        " (" + String(propiedades.cod_municipio || "sin código") + ")";
    });

    resultadoIdentificacion.textContent =
      datos.features.length === 1
        ? "Municipio que cubre el punto: " + nombres[0] + "."
        : datos.features.length + " municipios cubren el punto: " +
          nombres.join("; ") + ". Revisa si está sobre un límite compartido.";

  } catch (error) {
    if (!modoIdentificar || idSolicitud !== solicitudUbicacionActual) return;
    console.error("Fallo en consulta espacial F3:", error);
    resultadoIdentificacion.textContent =
      "No fue posible identificar la ubicación. Revisa FastAPI y la consola.";
  }
}

botonIdentificar.addEventListener("click", cambiarModoIdentificacion);

// Leaflet propaga al mapa los clics sobre polígonos cuando no hay popup activo.
mapa.on("click", evento => {
  if (modoIdentificar) identificarUbicacion(evento.latlng);
});

async function cargarMunicipios() {
  try {
    const respuesta = await fetch("/municipios", {
      headers: { Accept: "application/geo+json" }
    });
    if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);

    const datos = await respuesta.json();
    if (datos.type !== "FeatureCollection" ||
        !Array.isArray(datos.features) ||
        datos.features.length === 0) {
      throw new Error("GeoJSON vacío o estructura incorrecta");
    }

    municipios = L.geoJSON(datos, {
      style: estilo,
      onEachFeature: prepararMunicipio
    }).addTo(mapa);

    const limites = municipios.getBounds();
    if (!limites.isValid()) throw new Error("Geometrías sin extensión válida");

    mapa.fitBounds(limites, { padding: [20, 20] });
    contador.textContent = String(datos.features.length);
    estado.textContent = "Datos GeoJSON recibidos correctamente desde FastAPI.";
    botonCentrar.disabled = false;
    botonIdentificar.disabled = false;
  } catch (error) {
    console.error("Fallo al cargar municipios:", error);
    estado.classList.add("error");
    estado.textContent = "No fue posible cargar los municipios. Revisa la API y la consola.";
  }
}

botonCentrar.addEventListener("click", () => {
  if (municipios) mapa.fitBounds(municipios.getBounds(), { padding: [20, 20] });
});

cargarMunicipios();
