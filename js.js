window.addEventListener("load",()=>{

setTimeout(()=>{

document.getElementById("loading-screen").style.display="none";

},1200);

});

const darkToggle=document.getElementById("darkToggle");

darkToggle.addEventListener("click",()=>{

document.body.classList.toggle("dark");

});

const menuBtn=document.getElementById("menuMobile");

const menu=document.querySelector(".menu");

menuBtn.addEventListener("click",()=>{

menu.classList.toggle("ativo");

});
let cidades=[];

async function carregarCidades(){

try{

const resposta=await fetch(
"https://servicodados.ibge.gov.br/api/v1/localidades/municipios"
);

const dados=await resposta.json();

cidades=dados.map(c=>c.nome);

}catch(error){

console.error(error);

alert("Erro ao carregar cidades.");

}

}

carregarCidades();

const inputCidade=document.getElementById("cidade");

const sugestoes=document.getElementById("sugestoes");

inputCidade.addEventListener("input",()=>{

const texto=inputCidade.value.toLowerCase();

const resultados=cidades.filter(cidade=>

cidade.toLowerCase().includes(texto)

);

sugestoes.innerHTML="";

resultados.slice(0,8).forEach(cidade=>{

const item=document.createElement("div");

item.textContent=cidade;

item.onclick=()=>{

inputCidade.value=cidade;

sugestoes.innerHTML="";

};

sugestoes.appendChild(item);

});

});

const mapa=L.map("mapa").setView([-23.55052,-46.633308],6);
window.addEventListener("resize",()=>{

setTimeout(()=>{

mapa.invalidateSize();

},300);

});

L.tileLayer(

"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

{

attribution:"© OpenStreetMap"

}

).addTo(mapa);

let markers=[];

const listaEcopontos=

document.getElementById(
"listaEcopontos"
);
document
.getElementById("buscarBtn")
.addEventListener("click",buscarCidade);

async function buscarCidade(){

const cidade=inputCidade.value.trim();

if(!cidade){

alert("Digite uma cidade.");

return;

}

try{

markers.forEach(marker=>{

mapa.removeLayer(marker);

});

markers=[];

const geo=await fetch(

`https://nominatim.openstreetmap.org/search?format=json&q=${cidade},Brasil&limit=1`

);

const geoDados=await geo.json();

if(geoDados.length===0){

alert("Cidade não encontrada.");

return;

}

const lat=geoDados[0].lat;
const lon=geoDados[0].lon;

mapa.setView([lat,lon],12);

const overpass=await fetch(

`https://overpass-api.de/api/interpreter?data=
[out:json];
(
node["amenity"="recycling"](around:15000,${lat},${lon});
way["amenity"="recycling"](around:15000,${lat},${lon});
relation["amenity"="recycling"](around:15000,${lat},${lon});
);
out center;`

);

const resultado=await overpass.json();

if(resultado.elements.length===0){

alert("Nenhum ecoponto encontrado próximo dessa cidade.");

return;

}

listaEcopontos.innerHTML="";

resultado.elements.forEach(local=>{

const latitude=

local.lat || local.center.lat;

const longitude=

local.lon || local.center.lon;

const nome=

local.tags?.name ||

"Ecoponto / Reciclagem";

const marker=L.marker(

[latitude,longitude]

)

.addTo(mapa)

.bindPopup(

`<strong>${nome}</strong>`

);

markers.push(marker);

const li=document.createElement("li");

li.innerHTML=`

<strong>${nome}</strong>

<br>

<a href="https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}"

target="_blank">

Abrir no Google Maps

</a>

`;

listaEcopontos.appendChild(li);

});

salvarHistorico(cidade);

}catch(error){

console.error(error);

alert("Erro ao buscar ecopontos.");

}

}

document
.getElementById("usarLocalizacao")
.addEventListener("click",()=>{

navigator.geolocation.getCurrentPosition(

async(pos)=>{

const lat=pos.coords.latitude;

const lon=pos.coords.longitude;

markers.forEach(marker=>{

mapa.removeLayer(marker);

});

markers=[];

mapa.setView([lat,lon],14);

const userMarker=L.marker([lat,lon])

.addTo(mapa)

.bindPopup("Sua localização")

.openPopup();

markers.push(userMarker);

const overpass=await fetch(

`https://overpass-api.de/api/interpreter?data=
[out:json];
(
node["amenity"="recycling"](around:20000,${lat},${lon});
way["amenity"="recycling"](around:20000,${lat},${lon});
relation["amenity"="recycling"](around:20000,${lat},${lon});
);
out center;`

);

const resultado=await overpass.json();

listaEcopontos.innerHTML="";

if(resultado.elements.length===0){

listaEcopontos.innerHTML=

"<li>Nenhum ecoponto encontrado próximo.</li>";

return;

}

resultado.elements.forEach(local=>{

const latitude=

local.lat || local.center.lat;

const longitude=

local.lon || local.center.lon;

const nome=

local.tags?.name ||

"Ecoponto / Reciclagem";

const marker=L.marker(

[latitude,longitude]

)

.addTo(mapa)

.bindPopup(

`<strong>${nome}</strong>`

);

markers.push(marker);

const li=document.createElement("li");

li.innerHTML=`

<strong>${nome}</strong>

<br>

<a
href="https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}"
target="_blank"
>

Abrir no Google Maps

</a>

`;

listaEcopontos.appendChild(li);

});

},

(error)=>{

alert(

"Não foi possível obter sua localização."

);

},

{

enableHighAccuracy:true,

timeout:15000,

maximumAge:0

}

);

});

const historicoLista=

document.getElementById(
"historicoLista"
);

function salvarHistorico(cidade){

let historico=

JSON.parse(

localStorage.getItem(
"historico"
)

)||[];

if(!historico.includes(cidade)){

historico.unshift(cidade);

}

historico=historico.slice(0,5);

localStorage.setItem(

"historico",

JSON.stringify(historico)

);

renderHistorico();

}

function renderHistorico(){

const historico=

JSON.parse(

localStorage.getItem(
"historico"
)

)||[];

historicoLista.innerHTML="";

historico.forEach(cidade=>{

const li=document.createElement("li");

li.textContent=cidade;

historicoLista.appendChild(li);

});

}

renderHistorico();

const favoritosLista=

document.getElementById(
"favoritosLista"
);

document
.getElementById("favoritoBtn")
.addEventListener("click",()=>{

const cidade=inputCidade.value;

if(!cidade)return;

let favoritos=

JSON.parse(

localStorage.getItem(
"favoritos"
)

)||[];

if(!favoritos.includes(cidade)){

favoritos.push(cidade);

}

localStorage.setItem(

"favoritos",

JSON.stringify(favoritos)

);

renderFavoritos();

});

function renderFavoritos(){

const favoritos=

JSON.parse(

localStorage.getItem(
"favoritos"
)

)||[];

favoritosLista.innerHTML="";

favoritos.forEach(cidade=>{

const li=document.createElement("li");

li.textContent=cidade;

favoritosLista.appendChild(li);

});

}

renderFavoritos();