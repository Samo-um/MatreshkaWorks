const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static(__dirname));

let users = {};
let messages = [];

try {
  if (fs.existsSync('users.json')) users = JSON.parse(fs.readFileSync('users.json'));
  if (fs.existsSync('messages.json')) messages = JSON.parse(fs.readFileSync('messages.json'));
} catch (e) {
  console.log("No old data");
}

function save() {
  fs.writeFileSync('users.json', JSON.stringify(users));
  fs.writeFileSync('messages.json', JSON.stringify(messages));
}

// РЕГИСТРАЦИЯ / ВХОД
app.post('/api/register', (req, res) => {
  let { nick, pass } = req.body;
  nick = String(nick || "").trim();
  pass = String(pass || "").trim();

  // Проверка формата Nick_Name
  if (!nick.includes("_")) {
    return res.json({ ok: false, msg: "Формат: Nick_Name Пример: Nanya_Kauna" });
  }
  if (nick.length < 3) {
    return res.json({ ok: false, msg: "Ник слишком короткий" });
  }
  if (pass.length < 4) {
    return res.json({ ok: false, msg: "Пароль от 4 символов" });
  }

  // ЕСЛИ НИК УЖЕ СУЩЕСТВУЕТ
  if (users[nick]) {
    // Если пароль НЕ совпадает - ник занят!
    if (users[nick].pass !== pass) {
      return res.json({ ok: false, msg: "Никнейм занят! Придумай другой." });
    }
    // Если пароль совпадает - это владелец, пускаем
    return res.json({ ok: true, nick });
  }

  // ЕСЛИ НИК НОВЫЙ - РЕГИСТРИРУЕМ
  users[nick] = { pass, created: Date.now() };
  save();
  return res.json({ ok: true, nick });
});

app.get('/api/messages', (req, res) => {
  res.json(messages);
});

io.on('connection', (socket) => {
  socket.on('chat', (data) => {
    const msg = {
      user: data.user,
      text: data.text,
      time: new Date().toLocaleTimeString(),
      job: data.job || ""
    };
    messages.push(msg);
    if (messages.length > 200) messages.shift();
    save();
    io.emit('new_message', msg);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log("GROUND RUSSIA Forum running on " + PORT));
