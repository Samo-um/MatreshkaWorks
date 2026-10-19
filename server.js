const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// === ГЛАВНАЯ - ФИКС Cannot GET / ===
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GROUND RUSSIA - MatreshkaWorks</title>
<style>
body{margin:0;background:#0f0f0f;color:#fff;font-family:Arial;text-align:center;padding:20px}
h1{font-size:32px;color:#ff3b3b;text-shadow:0 0 10px red;margin-top:80px}
.box{max-width:400px;margin:30px auto;background:#1e1e1e;padding:25px;border-radius:15px;border:1px solid #ff3b3b}
input{width:90%;padding:12px;margin:10px 0;border-radius:8px;border:none;background:#2a2a2a;color:#fff}
button{width:95%;padding:12px;background:#ff3b3b;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer}
button:hover{background:#ff0000}
.status{margin-top:20px;color:#00ff88}
a{color:#ff3b3b;text-decoration:none}
</style>
</head>
<body>
<h1>🪆 GROUND RUSSIA</h1>
<p>MatreshkaWorks - Икаворкс Форум</p>

<div class="box">
<h3>Вход в систему</h3>
<input id="login" placeholder="Логин (Samo_Monopoly)" value="Samo_Monopoly">
<input id="pass" type="password" placeholder="Пароль">
<button onclick="enter()">ВОЙТИ В ИКАВОРКС</button>
<div class="status" id="status"></div>
</div>

<script>
function enter(){
  const l = document.getElementById('login').value;
  const p = document.getElementById('pass').value;
  if(!l || !p){ document.getElementById('status').innerText='Введи логин и пароль!'; return; }
  document.getElementById('status').innerText='Добро пожаловать, '+l+'! Загрузка форума...';
  setTimeout(()=>{ window.location.href='/forum'; }, 1000);
}
</script>
</body>
</html>
  `);
});

// === ФОРУМ ===
app.get('/forum', (req, res) => {
  res.send(`
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Форум GROUND RUSSIA</title>
<style>body{background:#0a0a0a;color:#fff;font-family:Arial;padding:15px}h2{color:#ff3b3b} .post{background:#1a1a1a;padding:15px;border-radius:10px;margin:10px 0;border-left:4px solid #ff3b3b}</style>
</head><body>
<h2>GROUND RUSSIA - Форум</h2>
<p>Вы вошли как: <b>Samo_Monopoly</b> | <a href="/" style="color:#ff3b3b">Выйти</a></p>
<div class="post"><b>Samo_Monopoly:</b> Форум успешно запущен! MatreshkaWorks работает.</div>
<div class="post"><b>Система:</b> Сервер на Render.com активен. Икаворкс подключен.</div>
<div class="post"><b>GROUND RUSSIA:</b> Добро пожаловать в обновленную версию!</div>
</body></html>
  `);
});

// API для проверки
app.get('/api/status', (req,res)=>{
  res.json({status:'online', project:'GROUND RUSSIA', user:'Samo_Monopoly', url:'https://matreshkaworks-5.onrender.com'});
});

app.listen(PORT, ()=> console.log('GROUND RUSSIA запущен на порту '+PORT));
