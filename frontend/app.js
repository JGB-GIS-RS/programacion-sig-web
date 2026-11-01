"use strict";

// F1: visualización; F2: detalle; F3: identificación; F4: proximidad a salud; F5: equipamientos por categoría.
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
const botonProximidad = document.getElementById("proximidad");
const radioProximidad = document.getElementById("radio-proximidad");
const estadoProximidad = document.getElementById("estado-proximidad");
const resultadoProximidad = document.getElementById("resultado-proximidad");
const selectorSedes = document.getElementById("municipio-sedes");
const selectorTipoSedes = document.getElementById("tipo-sedes");
const botonMostrarSedes = document.getElementById("mostrar-sedes");
const botonLimpiarSedes = document.getElementById("limpiar-sedes");
const resultadoSedes = document.getElementById("resultado-sedes");

let municipios = null;
let modoIdentificar = false;
let capaCoincidencias = null;
let marcadorConsulta = null;
let solicitudUbicacionActual = 0;
let modoProximidad = false;
let circuloProximidad = null;
let puntoProximidad = null;
let capaSaludProximidad = null;
let solicitudProximidadActual = 0;
let capaSedes = null;
let solicitudSedesActual = 0;

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
  if (!modoIdentificar && modoProximidad) cambiarModoProximidad();
  if (!modoIdentificar) limpiarSedes();

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


// F4: la distancia se calcula en PostGIS respecto a sedes de salud.
function limpiarProximidad() {
  if (circuloProximidad) mapa.removeLayer(circuloProximidad);
  if (puntoProximidad) mapa.removeLayer(puntoProximidad);
  if (capaSaludProximidad) mapa.removeLayer(capaSaludProximidad);
  circuloProximidad = null;
  puntoProximidad = null;
  capaSaludProximidad = null;
}

function cambiarModoProximidad() {
  if (!municipios) return;
  const radio = Number(radioProximidad.value);
  if (!modoProximidad && (!Number.isFinite(radio) || radio <= 0 || radio > 50000)) {
    estadoProximidad.textContent = "Introduce un radio mayor que 0 y hasta 50.000 metros.";
    return;
  }
  if (!modoProximidad && modoIdentificar) cambiarModoIdentificacion();
  if (!modoProximidad) limpiarSedes();

  modoProximidad = !modoProximidad;
  solicitudProximidadActual++;
  mapa.closePopup();
  municipios.eachLayer(capa => {
    if (modoProximidad) capa.unbindPopup();
    else if (capa.contenidoPopupLocal) capa.bindPopup(capa.contenidoPopupLocal);
  });
  botonProximidad.textContent = modoProximidad
    ? "Finalizar proximidad" : "Consultar salud cercana";
  botonProximidad.setAttribute("aria-pressed", String(modoProximidad));
  botonProximidad.classList.toggle("activo", modoProximidad);
  mapa.getContainer().classList.toggle("modo-proximidad", modoProximidad);
  radioProximidad.disabled = modoProximidad;
  limpiarProximidad();
  estadoProximidad.textContent = modoProximidad
    ? "Modo activo: haz clic en el mapa para buscar sedes de salud."
    : "Modo de proximidad desactivado.";
  resultadoProximidad.replaceChildren();
  resultadoProximidad.textContent = modoProximidad
    ? "PostGIS buscará sedes de salud dentro del radio indicado."
    : "Activa F4 para consultar de nuevo.";
}

async function consultarProximidad(latlng) {
  const radio = Number(radioProximidad.value);
  const idSolicitud = ++solicitudProximidadActual;
  limpiarProximidad();

  circuloProximidad = L.circle(latlng, {
    radius: radio, color: "#8b4b10", weight: 2,
    fillColor: "#f0b866", fillOpacity: 0.15,
    interactive: false
  }).addTo(mapa);
  puntoProximidad = L.circleMarker(latlng, {
    radius: 5, color: "#8b4b10", weight: 2,
    fillColor: "white", fillOpacity: 1, interactive: false
  }).addTo(mapa);

  estadoProximidad.textContent =
    "Longitud: " + latlng.lng.toFixed(5) +
    " · Latitud: " + latlng.lat.toFixed(5) +
    " · Radio: " + radio + " m";
  resultadoProximidad.textContent = "Consultando sedes de salud en PostGIS...";

  const parametros = new URLSearchParams({
    lon: String(latlng.lng),
    lat: String(latlng.lat),
    radio_m: String(radio)
  });
  try {
    const respuesta = await fetch("/consultas/proximidad?" + parametros, {
      headers: { Accept: "application/geo+json" }
    });
    if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
    const datos = await respuesta.json();
    if (datos.type !== "FeatureCollection" || !Array.isArray(datos.features)) {
      throw new Error("GeoJSON de proximidad incorrecto");
    }
    if (!modoProximidad || idSolicitud !== solicitudProximidadActual) return;

    capaSaludProximidad = L.geoJSON(datos, {
      pointToLayer: (_feature, coordenadas) => L.circleMarker(coordenadas, {
        radius: 6, color: "#6d2747", weight: 2,
        fillColor: "#d86586", fillOpacity: 0.95,
        bubblingMouseEvents: false
      }),
      onEachFeature: (feature, capa) => {
        const p = feature.properties || {};
        const contenedor = document.createElement("div");
        const nombre = document.createElement("strong");
        nombre.textContent = String(p.nombre || "Sede de salud");
        const direccion = document.createElement("p");
        direccion.textContent = "Dirección: " + String(p.direccion || "No disponible");
        const distancia = document.createElement("p");
        distancia.textContent = "Distancia directa: " +
          new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 })
            .format(Number(p.distancia_metros)) + " m";
        const codigo = document.createElement("p");
        codigo.textContent = "Código de habilitación: " + String(p.codigo_fuente || "—");
        contenedor.append(nombre, direccion, distancia, codigo);
        capa.bindPopup(contenedor);
      }
    }).addTo(mapa);
    puntoProximidad.bringToFront();

    resultadoProximidad.replaceChildren();
    if (!datos.features.length) {
      resultadoProximidad.textContent =
        "No hay sedes de salud registradas dentro del radio consultado.";
      return;
    }
    const resumen = document.createElement("p");
    resumen.textContent = datos.features.length + " sede(s) de salud encontradas, ordenadas por distancia directa:";
    const lista = document.createElement("ol");
    const formato = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
    for (const feature of datos.features) {
      const p = feature.properties || {};
      const fila = document.createElement("li");
      fila.textContent = String(p.nombre || "Sede de salud") + " — " +
        formato.format(Number(p.distancia_metros)) + " m";
      lista.append(fila);
    }
    resultadoProximidad.append(resumen, lista);
  } catch (error) {
    if (!modoProximidad || idSolicitud !== solicitudProximidadActual) return;
    console.error("Error F4:", error);
    resultadoProximidad.textContent =
      "No fue posible consultar sedes de salud. Revisa el backend y la consola.";
  }
}


function limpiarSedes() {
  solicitudSedesActual++;
  if (capaSedes) {
    mapa.removeLayer(capaSedes);
    capaSedes = null;
  }
  botonLimpiarSedes.disabled = true;
  resultadoSedes.textContent = "No hay equipamientos visibles.";
}

async function mostrarSedes() {
  const codigo = selectorSedes.value;
  const tipo = Number(selectorTipoSedes.value);
  if (!/^[0-9]{5}$/.test(codigo) || ![1, 2].includes(tipo)) return;

  // El modo de consulta por clic se desactiva antes de habilitar los popups F5.
  if (modoIdentificar) cambiarModoIdentificacion();
  if (modoProximidad) cambiarModoProximidad();

  limpiarSedes();
  const idSolicitud = ++solicitudSedesActual;
  botonMostrarSedes.disabled = true;
  resultadoSedes.textContent = "Solicitando equipamientos a FastAPI...";

  try {
    const respuesta = await fetch(
      "/equipamientos/municipio/" + encodeURIComponent(codigo) + "?tipo=" + tipo,
      { headers: { Accept: "application/geo+json" } }
    );
    if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
    const datos = await respuesta.json();
    if (datos.type !== "FeatureCollection" || !Array.isArray(datos.features)) {
      throw new Error("GeoJSON incorrecto");
    }
    if (idSolicitud !== solicitudSedesActual) return;

    capaSedes = L.geoJSON(datos, {
      pointToLayer: (_feature, latlng) => L.circleMarker(latlng, {
        radius: 5, color: "#173b54", weight: 1.5,
        fillColor: tipo === 1 ? "#e5a447" : "#b75472", fillOpacity: 0.9
      }),
      onEachFeature: (feature, capa) => {
        const propiedades = feature.properties || {};
        const contenedor = document.createElement("div");
        const nombre = document.createElement("strong");
        nombre.textContent = String(propiedades.nombre || "Equipamiento");
        const direccion = document.createElement("p");
        direccion.textContent = "Dirección: " + String(propiedades.direccion || "No disponible");
        const identificador = document.createElement("p");
        identificador.textContent = (tipo === 1 ? "Código DANE: " : "Código de habilitación: ") + String(propiedades.codigo_fuente || "—");
        contenedor.append(nombre, direccion, identificador);
        L.DomEvent.disableClickPropagation(contenedor);
        capa.bindPopup(contenedor);
      }
    }).addTo(mapa);

    const municipioSeleccionado = municipios.getLayers().find(capa =>
      String(capa.feature?.properties?.cod_municipio) === codigo
    );
    if (municipioSeleccionado) mapa.fitBounds(municipioSeleccionado.getBounds(), {padding: [25, 25]});
    resultadoSedes.textContent = datos.features.length + (tipo === 1 ? " sedes educativas" : " sedes de prestadores de salud") + " encontradas en " +
      selectorSedes.options[selectorSedes.selectedIndex].text + ".";
    botonLimpiarSedes.disabled = datos.features.length === 0;
  } catch (error) {
    if (idSolicitud !== solicitudSedesActual) return;
    console.error("Error F5:", error);
    resultadoSedes.textContent = "No fue posible cargar los equipamientos. Comprueba el endpoint F5.";
  } finally {
    botonMostrarSedes.disabled = false;
  }
}

botonMostrarSedes.addEventListener("click", mostrarSedes);
botonLimpiarSedes.addEventListener("click", limpiarSedes);
selectorSedes.addEventListener("change", limpiarSedes);
selectorTipoSedes.addEventListener("change", limpiarSedes);

botonProximidad.addEventListener("click", cambiarModoProximidad);

botonIdentificar.addEventListener("click", cambiarModoIdentificacion);

// Leaflet propaga al mapa los clics sobre polígonos cuando no hay popup activo.
mapa.on("click", evento => {
  if (modoIdentificar) identificarUbicacion(evento.latlng);
  else if (modoProximidad) consultarProximidad(evento.latlng);
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
    const opciones = [...datos.features]
      .map(f => ({
        codigo: String(f.properties?.cod_municipio || ""),
        nombre: String(f.properties?.nombre || "")
      }))
      .filter(x => /^[0-9]{5}$/.test(x.codigo))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    selectorSedes.replaceChildren();
    for (const opcion of opciones) {
      const item = document.createElement("option");
      item.value = opcion.codigo;
      item.textContent = opcion.nombre;
      selectorSedes.append(item);
    }
    selectorSedes.value = opciones.some(x => x.codigo === "63001") ? "63001" : opciones[0]?.codigo || "";
    selectorSedes.disabled = opciones.length === 0;
    botonMostrarSedes.disabled = opciones.length === 0;
    contador.textContent = String(datos.features.length);
    estado.textContent = "Datos GeoJSON recibidos correctamente desde FastAPI.";
    botonCentrar.disabled = false;
    botonIdentificar.disabled = false;
    botonProximidad.disabled = false;
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
