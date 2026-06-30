const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Ensure data directory exists
const DATA_DIR = "/app/data";
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Init SQLite
const db = new Database(path.join(DATA_DIR, "todos.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    done INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// API
app.get("/api/todos", (req, res) => {
  const todos = db.prepare("SELECT * FROM todos ORDER BY created_at DESC").all();
  res.json(todos);
});

app.post("/api/todos", (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: "text required" });
  const info = db.prepare("INSERT INTO todos (text) VALUES (?)").run(text.trim());
  const todo = db.prepare("SELECT * FROM todos WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(todo);
});

app.put("/api/todos/:id", (req, res) => {
  const { done } = req.body;
  db.prepare("UPDATE todos SET done = ? WHERE id = ?").run(done ? 1 : 0, req.params.id);
  const todo = db.prepare("SELECT * FROM todos WHERE id = ?").get(req.params.id);
  res.json(todo);
});

app.delete("/api/todos/:id", (req, res) => {
  db.prepare("DELETE FROM todos WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Serve SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Todo app running on port ${PORT}`);
});
