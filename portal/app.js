"use strict";
const modulos = [
  {numero:"01",titulo:"HTML y CSS",descripcion:"Estructura de páginas web, formularios, estilos y ejercicios aplicados.",temas:["HTML","CSS"],url:"../practicas/01-fundamentos-web/",nota:"7 lecciones y 1 ejercicio aplicado"},
  {numero:"02",titulo:"Fundamentos de JavaScript",descripcion:"Variables, condicionales, ciclos, funciones y programación con objetos.",temas:["JavaScript","Lógica"],url:"../practicas/02-fundamentos-javascript/",nota:"6 ejemplos didácticos"},
  {numero:"03",titulo:"Fundamentos de Leaflet",descripcion:"Mapas, controles, eventos, geometrías y consulta de GeoJSON.",temas:["Leaflet","GeoJSON"],url:"../practicas/03-leaflet-fundamentos/",nota:"9 prácticas"},
  {numero:"04",titulo:"Integración con Leaflet",descripcion:"Interfaces cartográficas, barras laterales y herramientas de edición; ruteo pendiente de revisión segura.",temas:["Interfaces","Plugins"],url:"../practicas/04-leaflet-integracion/",nota:"2 prácticas disponibles"},
  {numero:"05",titulo:"SIG Web con PostGIS y FastAPI",descripcion:"Ejercicio integrador del Quindío: datos, arquitectura, funcionalidades F1–F5, documentación y código real.",temas:["PostGIS","FastAPI","Leaflet"],url:"../practicas/05-sig-postgis-fastapi/",nota:"Guía académica y aplicación local"},
  {numero:"06",titulo:"Proyectos integradores",descripcion:"Propuestas y desarrollos aplicados: inventario geográfico y Geoalerta, con su estado real de avance.",temas:["Proyectos","SIG Web"],url:"../proyectos/",nota:"Documentación y proyectos en desarrollo"}
];
const contenedor=document.querySelector("#tarjetas");
modulos.forEach(m=>{
  const articulo=document.createElement("article");articulo.className="tarjeta";
  const numero=document.createElement("div");numero.className="num";numero.textContent="MÓDULO "+m.numero;
  const titulo=document.createElement("h3");titulo.textContent=m.titulo;
  const descripcion=document.createElement("p");descripcion.textContent=m.descripcion;
  const etiquetas=document.createElement("div");etiquetas.className="etiquetas";
  m.temas.forEach(t=>{const etiqueta=document.createElement("span");etiqueta.textContent=t;etiquetas.append(etiqueta)});
  const detalle=document.createElement("span");detalle.className="detalle";detalle.textContent=m.nota;
  const enlace=document.createElement("a");enlace.href=m.url;enlace.textContent="Explorar módulo →";
  articulo.append(numero,titulo,descripcion,etiquetas,detalle,enlace);
  contenedor.append(articulo);
});
