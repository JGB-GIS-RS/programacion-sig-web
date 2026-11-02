const mapa=L.map("mapa").setView([4.555959,-75.659946],16);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(mapa);
// DATOS DE EJEMPLO: categorías atribuidas a puntos didácticos, NO inventario oficial de sedes.
const datos={type:"FeatureCollection",features:[
{type:"Feature",properties:{nombre:"Ejemplo A",categoria:"Educativo"},geometry:{type:"Point",coordinates:[-75.661361,4.555627]}},
{type:"Feature",properties:{nombre:"Ejemplo B",categoria:"Salud"},geometry:{type:"Point",coordinates:[-75.658122,4.556252]}},
{type:"Feature",properties:{nombre:"Ejemplo C",categoria:"Educativo"},geometry:{type:"Point",coordinates:[-75.658762,4.554568]}},
{type:"Feature",properties:{nombre:"Ejemplo D",categoria:"Salud"},geometry:{type:"Point",coordinates:[-75.660510,4.554930]}}
]};
let capa=null;
function mostrar(tipo="todos"){
 if(capa)mapa.removeLayer(capa);
 capa=L.geoJSON(datos,{filter:f=>tipo==="todos"||f.properties.categoria===tipo,
 pointToLayer:(f,latlng)=>L.circleMarker(latlng,{radius:9,color:f.properties.categoria==="Salud"?"#c23d5b":"#ba8427",fillOpacity:.75}),
 onEachFeature:(f,l)=>l.bindPopup(f.properties.nombre+" · "+f.properties.categoria)}).addTo(mapa);
 document.querySelector("#conteo").textContent="Entidades visibles: "+capa.getLayers().length;
}
document.querySelectorAll("[data-tipo]").forEach(b=>b.addEventListener("click",()=>mostrar(b.dataset.tipo)));
mostrar();
