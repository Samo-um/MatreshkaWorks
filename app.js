const API_BASE = "https://matreshkaworks-5.onrender.com/api";
const prices = [
  {name:"🔫 1. Перепродажа оружия", price:"25.000 ₽", desc:"Покупка и перепродажа оружия с целью получения прибыли."},
  {name:"👔 2. Продажа дорогой одежды", price:"15.000 ₽", desc:"Продажа эксклюзивной одежды и редких предметов обеспеченным клиентам."},
  {name:"🚘 3. Скрытие автомобиля и содержимого", price:"30.000 ₽", desc:"Услуга по сокрытию автомобиля и находящихся внутри вещей в рамках игрового RP."},
  {name:"🏗 4. Строительный бизнес", price:"75.000 ₽", desc:"Перевозка строительных материалов. Оплата: 10.000 ₽ за каждую перевозку."},
  {name:"🚕 5. Работа таксистом", price:"5.000 ₽", desc:"Перевозка пассажиров по городу, выполнение заказов и получение оплаты за поездки."},
  {name:"💼 6. Барыга", price:"700.000 ₽ / 700 🪙", desc:"Торговля редкими товарами и поиск выгодных сделок для получения прибыли."},
  {name:"🏢 7. Директор строительной компании", price:"1.700.000 ₽", desc:"Управление строительной компанией, организация перевозок, контроль сотрудников и развитие бизнеса. Доход: 200.000 ₽ в день."},
  {name:"👮 8. Назначение карт и организация рейдов", price:"45.000 ₽", desc:"Подготовка игровых мероприятий для сотрудников полиции, назначение карт и организация RP-рейдов."}
];
let token = localStorage.getItem("mw_token") || "";
let me = null;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(path, opts={}) {
  const res = await fetch(API_BASE+path,{...opts,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{}),...(opts.headers||{})}});
  const data = await res.json().catch(()=>({error:"Не удалось прочитать ответ сервера."}));
  if(!res.ok) throw new Error(data.error || "Ошибка запроса.");
  return data;
}
function say(id,text){$(id).textContent=text}
function show(id,on){$(id).classList.toggle("hidden",!on)}
function drawPrices(){
  $("prices").innerHTML=prices.map(p=>`<article class="card"><h3>${esc(p.name)}</h3><div class="price">${esc(p.price)}</div><p class="muted">${esc(p.desc)}</p></article>`).join("");
  $("service").innerHTML=prices.map(p=>`<option>${esc(p.name)}</option>`).join("");
}
function tab(name){
  document.querySelectorAll(".tabpage").forEach(x=>x.classList.add("hidden"));
  $(name).classList.remove("hidden");
  document.querySelectorAll(".tabs button").forEach(x=>x.classList.toggle("active",x.dataset.tab===name));
  if(name==="orders") loadOrders();
  if(name==="chat") loadChat();
  if(name==="staff" && me?.role==="director") loadUsers();
}
document.querySelectorAll(".tabs button").forEach(b=>b.addEventListener("click",()=>tab(b.dataset.tab)));
async function enter(data){
  token=data.token;me=data.user;localStorage.setItem("mw_token",token);
  show("auth",false);show("app",true);show("logout",true);show("stafftab",me.role==="director");
  $("hello").textContent=me.email;
  $("role").textContent=({director:"👑 Director — владелец компании",admin:"🛡️ Admin — администратор",player:"👤 Игрок"})[me.role];
  await loadOrders();
}
$("login").onclick=async()=>{try{await enter(await api("/login",{method:"POST",body:JSON.stringify({email:$("email").value,password:$("password").value})}));say("authmsg","")}catch(e){say("authmsg",e.message)}};
$("register").onclick=async()=>{try{await enter(await api("/register",{method:"POST",body:JSON.stringify({email:$("email").value,password:$("password").value})}));say("authmsg","")}catch(e){say("authmsg",e.message)}};
$("logout").onclick=()=>{localStorage.removeItem("mw_token");token="";me=null;show("auth",true);show("app",false);show("logout",false)};
$("createorder").onclick=async()=>{try{await api("/orders",{method:"POST",body:JSON.stringify({service:$("service").value,details:$("details").value})});$("details").value="";say("ordermsg","Заказ отправлен!");}catch(e){say("ordermsg",e.message)}};
async function loadOrders(){try{const d=await api("/orders");$("orderlist").innerHTML=d.orders.length?d.orders.map(o=>`<div class="item"><div><b>#${o.id} · ${esc(o.service)}</b><div class="muted">${esc(o.email||me.email)} · ${esc(o.created_at)}</div><div>${esc(o.details)}</div></div><div><div class="status">${esc(({new:"Новый",in_progress:"В работе",done:"Готов",cancelled:"Отменён"})[o.status]||o.status)}</div>${["director","admin"].includes(me.role)?`<select data-order="${o.id}" class="statuschange"><option value="new">Новый</option><option value="in_progress">В работе</option><option value="done">Готов</option><option value="cancelled">Отменён</option></select>`:""}</div></div>`).join(""):"<p class='muted'>Пока заказов нет.</p>";
document.querySelectorAll(".statuschange").forEach(s=>{const id=s.dataset.order;s.onchange=async()=>{try{await api("/orders/"+id,{method:"PATCH",body:JSON.stringify({status:s.value})});loadOrders()}catch(e){alert(e.message)}}});
}catch(e){$("orderlist").textContent=e.message}}
async function loadChat(){if(!me)return;try{const d=await api("/messages/"+me.id);$("chatbox").innerHTML=d.messages.map(m=>`<div class="bubble ${m.sender_id===me.id?"mine":""}"><small>${esc(m.sender_email)} · ${esc(m.created_at)}</small>${esc(m.body)}</div>`).join("")||"<p class='muted'>Начни переписку с компанией.</p>";$("chatbox").scrollTop=$("chatbox").scrollHeight}catch(e){say("chatmsg",e.message)}}
$("sendmsg").onclick=async()=>{try{await api("/messages/"+me.id,{method:"POST",body:JSON.stringify({body:$("chattext").value})});$("chattext").value="";say("chatmsg","");await loadChat()}catch(e){say("chatmsg",e.message)}};
$("appoint").onclick=async()=>{try{const d=await api("/admins",{method:"POST",body:JSON.stringify({email:$("staffemail").value})});say("staffmsg",d.message);$("staffemail").value="";loadUsers()}catch(e){say("staffmsg",e.message)}};
async function loadUsers(){try{const d=await api("/users");$("userlist").innerHTML=d.users.map(u=>`<div class="item"><div><b>${esc(u.email)}</b><div class="muted">${esc(u.role)}</div></div>${u.role==="admin"?`<button class="secondary" data-remove="${u.id}">Снять права</button>`:""}</div>`).join("");document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=async()=>{if(!confirm("Снять права администратора?"))return;try{await api("/admins/"+b.dataset.remove,{method:"DELETE"});loadUsers()}catch(e){say("staffmsg",e.message)}})}catch(e){say("staffmsg",e.message)}}
drawPrices();
if(token){api("/me").then(d=>enter({token,user:d.user})).catch(()=>{localStorage.removeItem("mw_token");token=""})}
