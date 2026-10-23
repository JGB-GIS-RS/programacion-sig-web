"use strict";

// F1: Leaflet representa los datos que consulta FastAPI desde PostGIS.
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

function prepararMunicipio(feature, capa) {
  const atributos = feature.properties || {};
  // Se crean nodos DOM para no interpretar los atributos como HTML.
  const contenido = document.createElement("div");
  const titulo = document.createElement("strong");
  titulo.textContent = String(atributos.nombre || "Municipio");
  const codigo = document.createElement("p");
  codigo.textContent = "Código DIVIPOLA: " + String(atributos.cod_municipio || "—");
  contenido.append(titulo, codigo);
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
