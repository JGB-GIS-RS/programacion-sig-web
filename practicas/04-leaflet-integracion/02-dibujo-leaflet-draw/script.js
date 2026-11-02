const mapa=L.map("mapa").setView([4.555959,-75.659946],16);L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(mapa);
const dibujados=new L.FeatureGroup();mapa.addLayer(dibujados);
const control=new L.Control.Draw({edit:{featureGroup:dibujados},draw:{circlemarker:false}});mapa.addControl(control);
const salida=document.querySelector("#salida");function actualizar(){salida.textContent="Entidades dibujadas: "+dibujados.getLayers().length}
mapa.on(L.Draw.Event.CREATED,e=>{dibujados.addLayer(e.layer);actualizar()});
mapa.on(L.Draw.Event.DELETED,actualizar);
mapa.on(L.Draw.Event.EDITED,actualizar);
actualizar();