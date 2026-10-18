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
  if(fs.existsSync('users.json')) users = JSON.parse(fs.readFileSync('users.json'));
  if(fs.existsSync('messages.json')) messages = JSON.parse(fs.readFileSync('messages.json'));
} catch(e){}

function save(){
  fs.writeFileSync('users.json', JSON.stringify(users));
  fs.writeFileSync('messages.json', JSON.stringify(messages));
}

app.post('/api/register', (req,res)=>{
  let {nick, pass} = req.body;
  if(!/^[A-Za-z]+_[A-Za-z]+$/.test(nick)){
    return res.json({ok:false, msg:"Ник должен быть в формате Nick_Name Пример: Samo_Monopoly"});
  }
  if(users[nick]){
    if(users[nick].pass !== pass) return res.json({ok:false, msg:"Никнейм занят! Придумай другой."});
    return res.json({ok:true, nick});
  }
  users[nick] = {pass, created: Date.now()};
  save();
  res.json({ok:true, nick});
});

app.get('/api/messages', (req,res)=> res.json(messages));

io.on('connection', (socket)=>{
  socket.on('chat', (data)=>{
    const msg = {user: data.user, text: data.text, time: new Date().toLocaleTimeString(), job: data.job||""};
    messages.push(msg);
    if(messages.length>200) messages.shift();
    save();
    io.emit('new_message', msg);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, ()=> console.log("GROUND RUSSIA Forum running on "+PORT));
