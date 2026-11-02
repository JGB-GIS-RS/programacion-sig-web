const mapa=L.map("mapa").setView([4.555959,-75.659946],16);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(mapa);
// GeoJSON utiliza [longitud, latitud]; Leaflet L.marker usa [latitud, longitud].
const datos={"type":"FeatureCollection","features":[
{"type":"Feature","properties":{"nombre":"Punto A","clase":"Referencia didáctica"},"geometry":{"type":"Point","coordinates":[-75.661361,4.555627]}},
{"type":"Feature","properties":{"nombre":"Punto B","clase":"Referencia didáctica"},"geometry":{"type":"Point","coordinates":[-75.658122,4.556252]}},
{"type":"Feature","properties":{"nombre":"Punto C","clase":"Referencia didáctica"},"geometry":{"type":"Point","coordinates":[-75.658762,4.554568]}},
{"type":"Feature","properties":{"nombre":"Recorrido de ejemplo","clase":"Línea"},"geometry":{"type":"LineString","coordinates":[[-75.661793,4.555564],[-75.660455,4.554928],[-75.659214,4.555944],[-75.658146,4.556311],[-75.657458,4.555075]]}}
]};
const capa=L.geoJSON(datos,{style:{color:"#c24949",weight:4},onEachFeature:(f,c)=>c.bindPopup(f.properties.nombre+" · "+f.properties.clase)}).addTo(mapa);
mapa.fitBounds(capa.getBounds().pad(0.15));
