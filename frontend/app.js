"use strict";

// F1: representación de GeoJSON; F2: consulta remota de detalle municipal.
const mapa = L.map("mapa").setView([4.5, -75.7], 9);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; colaboradores de OpenStreetMap"
}).addTo(mapa);

const estado = document.getElementById("estado");
const contador = document.getElementById("total");
const botonCentrar = document.getElementById("centrar");
let municipios = null;

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
  capa.bindPopup(contenido);

  capa.on("mouseover", () => capa.setStyle({ weight: 3, fillOpacity: 0.55 }));
  capa.on("mouseout", () => municipios.resetStyle(capa));
}

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
