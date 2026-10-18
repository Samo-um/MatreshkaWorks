const API_BASE = "https://matreshkaworks-5.onrender.com";
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
async function loadMe() {
  try { me = await api("/api/auth/me"); } catch { me = null; token=""; localStorage.removeItem("mw_token"); }
}
function render() {
  const auth = $("auth"), app = $("app");
  if (me) {
    if(auth) auth.style.display="none";
    if(app) app.style.display="block";
    if($("user")) $("user").innerHTML = esc(me.email || me.username || "Игрок");
    renderWorks();
  } else {
    if(auth) auth.style.display="block";
    if(app) app.style.display="none";
  }
}
function renderWorks() {
  const box = $("works");
  if(!box) return;
  box.innerHTML = prices.map((p,i)=>`<div class="work-card"><h3>${esc(p.name)}</h3><b>${esc(p.price)}</b><p>${esc(p.desc)}</p><button onclick="startWork(${i})">Начать</button></div>`).join("");
}
async function startWork(i) {
  try { await api("/api/works/start",{method:"POST",body:JSON.stringify({workId:i})}); alert("Работа началась: " + prices[i].name); }
  catch(e){ alert(e.message); }
}
async function login() {
  const email = $("email")?.value, password = $("password")?.value;
  if(!email||!password) return alert("Введи email и пароль");
  try { const d = await api("/api/auth/login",{method:"POST",body:JSON.stringify({email,password})}); token=d.token; localStorage.setItem("mw_token",token); await loadMe(); render(); }
  catch(e){ alert(e.message); }
}
async function register() {
  const email = $("email")?.value, password = $("password")?.value;
  if(!email||!password) return alert("Введи email и пароль");
  try { const d = await api("/api/auth/register",{method:"POST",body:JSON.stringify({email,password})}); token=d.token; localStorage.setItem("mw_token",token); await loadMe(); render(); }
  catch(e){ alert(e.message); }
}
function logout() { token=""; me=null; localStorage.removeItem("mw_token"); render(); }
(async ()=>{ await loadMe(); render(); })();
window.login = login; window.register = register; window.logout = logout; window.startWork = startWork;
