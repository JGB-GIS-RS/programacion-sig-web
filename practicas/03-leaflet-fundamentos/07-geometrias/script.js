const mapa=L.map("mapa").setView([4.555959,-75.659946],16);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(mapa);
L.marker([4.555959,-75.659946]).addTo(mapa).bindPopup("Punto de referencia didáctico");
L.marker([4.557479,-75.66164],{draggable:true}).addTo(mapa).bindPopup("Marcador arrastrable");
L.circle([4.557,-75.662],{radius:50,color:"#1464af",fillColor:"#1464af",fillOpacity:0.2}).addTo(mapa).bindPopup("Círculo: 50 metros");
L.circleMarker([4.556,-75.657],{radius:12,color:"#b55b08"}).addTo(mapa).bindPopup("CircleMarker: radio en píxeles");
L.polygon([[4.555944,-75.660562],[4.556623,-75.659832],[4.556345,-75.659145],[4.555815,-75.659317],[4.554533,-75.658721],[4.55441,-75.660359]],{color:"#079889",fillOpacity:0.13}).addTo(mapa).bindPopup("Polígono demostrativo");
const recorrido=[[4.554747,-75.662291],[4.556607,-75.661148],[4.557217,-75.659828],[4.556645,-75.658320],[4.557222,-75.657112]];
L.polyline(recorrido,{color:"#ba3b3b",weight:4}).addTo(mapa).bindTooltip("Polilínea de ejemplo");
