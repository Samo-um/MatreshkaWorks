import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Database from "better-sqlite3";

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));
app.use(express.json({ limit: "200kb" }));

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
const DIRECTOR_EMAIL = String(process.env.DIRECTOR_EMAIL || "").trim().toLowerCase();
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("Set JWT_SECRET to a random secret of at least 32 characters.");
  process.exit(1);
}
if (!DIRECTOR_EMAIL) {
  console.error("Set DIRECTOR_EMAIL to the owner's registration email.");
  process.exit(1);
}

const db = new Database(process.env.DB_PATH || "matreshkarp.sqlite");
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'player' CHECK(role IN ('director','admin','player')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id),
 service TEXT NOT NULL,
 details TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','in_progress','done','cancelled')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id),
 sender_id INTEGER NOT NULL REFERENCES users(id),
 body TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

const sign = u => jwt.sign({ id:u.id, email:u.email, role:u.role }, JWT_SECRET, { expiresIn:"7d" });
function auth(req,res,next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  try {
    if (!token) throw new Error("missing");
    req.user = jwt.verify(token, JWT_SECRET);
    const current = db.prepare("SELECT id,email,role FROM users WHERE id=?").get(req.user.id);
    if (!current) throw new Error("user missing");
    req.user = current;
    next();
  } catch { return res.status(401).json({error:"Нужно войти в аккаунт."}); }
}
const directorOnly = (req,res,next) => req.user.role === "director"
  ? next() : res.status(403).json({error:"Доступ только владельцу компании."});
const staffOnly = (req,res,next) => ["director","admin"].includes(req.user.role)
  ? next() : res.status(403).json({error:"Доступ только персоналу."});

app.get("/api/health", (_,res) => res.json({ok:true, app:"MATRESHKARP_WORKS"}));

app.post("/api/register", (req,res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:"Укажи корректную электронную почту."});
  if (password.length < 10) return res.status(400).json({error:"Пароль должен содержать не менее 10 символов."});
  if (password.length > 200) return res.status(400).json({error:"Слишком длинный пароль."});
  const role = email === DIRECTOR_EMAIL ? "director" : "player";
  try {
    const hash = bcrypt.hashSync(password, 12);
    const info = db.prepare("INSERT INTO users(email,password_hash,role) VALUES(?,?,?)").run(email,hash,role);
    const user = {id:Number(info.lastInsertRowid),email,role};
    return res.status(201).json({token:sign(user),user});
  } catch { return res.status(409).json({error:"Этот email уже зарегистрирован."}); }
});

app.post("/api/login", (req,res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const u = db.prepare("SELECT id,email,password_hash,role FROM users WHERE email=?").get(email);
  if (!u || !bcrypt.compareSync(password,u.password_hash)) return res.status(401).json({error:"Неверный email или пароль."});
  const user = {id:u.id,email:u.email,role:u.role};
  res.json({token:sign(user),user});
});

app.get("/api/me", auth, (req,res) => res.json({user:req.user}));

app.get("/api/users", auth, directorOnly, (_,res) => {
  res.json({users:db.prepare("SELECT id,email,role,created_at FROM users ORDER BY id").all()});
});

app.post("/api/admins", auth, directorOnly, (req,res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const target = db.prepare("SELECT id,email,role FROM users WHERE email=?").get(email);
  if (!target) return res.status(404).json({error:"Пользователь с таким email не зарегистрирован."});
  if (target.role === "director") return res.status(400).json({error:"Нельзя изменить роль владельца."});
  db.prepare("UPDATE users SET role='admin' WHERE id=?").run(target.id);
  res.json({ok:true,message:`${target.email} назначен администратором.`});
});
app.delete("/api/admins/:id", auth, directorOnly, (req,res) => {
  const id = Number(req.params.id);
  const target = db.prepare("SELECT id,email,role FROM users WHERE id=?").get(id);
  if (!target) return res.status(404).json({error:"Пользователь не найден."});
  if (target.role === "director") return res.status(400).json({error:"Нельзя снять владельца."});
  db.prepare("UPDATE users SET role='player' WHERE id=?").run(id);
  res.json({ok:true,message:`Права администратора сняты у ${target.email}.`});
});

app.get("/api/orders", auth, (req,res) => {
  const rows = req.user.role === "player"
    ? db.prepare("SELECT o.*,u.email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.user_id=? ORDER BY o.id DESC").all(req.user.id)
    : db.prepare("SELECT o.*,u.email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC").all();
  res.json({orders:rows});
});
app.post("/api/orders", auth, (req,res) => {
  const service = String(req.body.service || "").trim().slice(0,100);
  const details = String(req.body.details || "").trim().slice(0,2000);
  if (!service) return res.status(400).json({error:"Выбери услугу."});
  const info = db.prepare("INSERT INTO orders(user_id,service,details) VALUES(?,?,?)").run(req.user.id,service,details);
  res.status(201).json({ok:true,id:Number(info.lastInsertRowid)});
});
app.patch("/api/orders/:id", auth, staffOnly, (req,res) => {
  const status = String(req.body.status || "");
  if (!["new","in_progress","done","cancelled"].includes(status)) return res.status(400).json({error:"Недопустимый статус."});
  const info = db.prepare("UPDATE orders SET status=? WHERE id=?").run(status,Number(req.params.id));
  if (!info.changes) return res.status(404).json({error:"Заказ не найден."});
  res.json({ok:true});
});

app.get("/api/messages/:userId", auth, (req,res) => {
  const userId = Number(req.params.userId);
  if (req.user.role === "player" && req.user.id !== userId) return res.status(403).json({error:"Нет доступа к этому чату."});
  const exists = db.prepare("SELECT id FROM users WHERE id=?").get(userId);
  if (!exists) return res.status(404).json({error:"Пользователь не найден."});
  const messages = db.prepare(`SELECT m.id,m.user_id,m.sender_id,m.body,m.created_at,u.email AS sender_email
    FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.user_id=? ORDER BY m.id`).all(userId);
  res.json({messages});
});
app.post("/api/messages/:userId", auth, (req,res) => {
  const userId = Number(req.params.userId);
  if (req.user.role === "player" && req.user.id !== userId) return res.status(403).json({error:"Нет доступа к этому чату."});
  const target = db.prepare("SELECT id FROM users WHERE id=?").get(userId);
  const body = String(req.body.body || "").trim().slice(0,3000);
  if (!target) return res.status(404).json({error:"Пользователь не найден."});
  if (!body) return res.status(400).json({error:"Сообщение пустое."});
  const info = db.prepare("INSERT INTO messages(user_id,sender_id,body) VALUES(?,?,?)").run(userId,req.user.id,body);
  res.status(201).json({ok:true,id:Number(info.lastInsertRowid)});
});

app.use((err,req,res,next) => {
  console.error(err);
  res.status(500).json({error:"Внутренняя ошибка сервера."});
});
app.listen(PORT, () => console.log(`MATRESHKARP_WORKS API listening on port ${PORT}`));
