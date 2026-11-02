"use strict";
// El catálogo no presume que las prácticas aún no incorporadas sean ejecutables.
const practicas=[
 {id:"01",titulo:"Fundamentos de HTML y CSS",descripcion:"Siete lecciones de HTML y un ejercicio aplicado de CSS externo.",tecnologias:["HTML","CSS"],estado:"disponible",url:"../practicas/01-fundamentos-web/"},
 {id:"01B",titulo:"Fundamentos de JavaScript",descripcion:"Seis lecciones de variables, condicionales, ciclos, funciones y objetos.",tecnologias:["JavaScript","Lógica"],estado:"disponible",url:"../practicas/02-fundamentos-javascript/"},
 {id:"02",titulo:"Leaflet: fundamentos cartográficos",descripcion:"Nueve prácticas: mapas base, controles, métodos, eventos, geometrías y GeoJSON.",tecnologias:["JavaScript","Leaflet"],estado:"disponible",url:"../practicas/03-leaflet-fundamentos/"},
 {id:"03",titulo:"Eventos en Leaflet",descripcion:"Interacciones de clic, movimiento y menú contextual sobre el mapa.",tecnologias:["JavaScript","Eventos"],estado:"pendiente"},
 {id:"04",titulo:"Ruteo mediante geoservicios",descripcion:"Consulta a una API externa y representación de rutas y resultados.",tecnologias:["HTTP","API","Leaflet"],estado:"pendiente"},
 {id:"05",titulo:"Leaflet: interfaces y herramientas",descripcion:"Barra lateral con búsqueda y edición de geometrías mediante Leaflet.draw.",tecnologias:["HTML","CSS","Leaflet"],estado:"disponible",url:"../practicas/04-leaflet-integracion/"},
 {id:"06",titulo:"SIG Web con PostGIS y FastAPI",descripcion:"Cinco funcionalidades: municipios, detalle, identificación, proximidad y equipamientos. Requiere API y base local.",tecnologias:["PostGIS","FastAPI","Leaflet"],estado:"disponible",url:"http://127.0.0.1:8000/"},
 {id:"07",titulo:"Inventario geográfico universitario",descripcion:"Ejercicio de registro y consulta de entidades geográficas, pendiente de incorporación al portal.",tecnologias:["Leaflet","GeoJSON"],estado:"pendiente"}
];
const tarjetas=document.querySelector("#tarjetas");const filtro=document.querySelector("#filtro");
function dibujar(){
 const estado=filtro.value;tarjetas.replaceChildren();
 practicas.filter(p=>estado==="todas"||p.estado===estado).forEach(p=>{
  const article=document.createElement("article");article.className="tarjeta";
  const num=document.createElement("div");num.className="num";num.textContent="PRÁCTICA "+p.id;
  const title=document.createElement("h3");title.textContent=p.titulo;
  const d=document.createElement("p");d.textContent=p.descripcion;
  const tags=document.createElement("div");tags.className="etiquetas";
  p.tecnologias.forEach(t=>{const s=document.createElement("span");s.textContent=t;tags.append(s)});
  const state=document.createElement("span");state.className="estado "+p.estado;state.textContent=p.estado==="disponible"?(p.id==="06"?"Acceso local disponible":"Prácticas incorporadas"):"Por integrar";
  article.append(num,title,d,tags,state);
  if(p.url){const a=document.createElement("a");a.href=p.url;a.textContent=p.id==="06"?"Abrir en servidor local ↗":"Abrir módulo ↗";a.title=p.id==="06"?"Requiere FastAPI ejecutándose en este equipo":"Ejercicios estáticos servidos por HTTP";article.append(a)}
  tarjetas.append(article);
 });
}
filtro.addEventListener("change",dibujar);dibujar();