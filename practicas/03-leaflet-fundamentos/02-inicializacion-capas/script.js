const mapa=L.map("mapa",{center:[4.555959,-75.659946],zoom:16});const osm=L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'});osm.addTo(mapa);
const sat=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:19,attribution:"Tiles &copy; Esri and contributors"});
L.control.layers({"OpenStreetMap":osm,"Imágenes Esri":sat}).addTo(mapa);
