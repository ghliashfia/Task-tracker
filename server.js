const express = require("express");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Database (satu tabel: tasks) ----------
const db = new DatabaseSync(path.join(__dirname, "tasks.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    course      TEXT    NOT NULL DEFAULT '',
    description TEXT    NOT NULL DEFAULT '',
    deadline    TEXT    NOT NULL,              -- format YYYY-MM-DD
    priority    TEXT    NOT NULL DEFAULT 'sedang' CHECK (priority IN ('rendah','sedang','tinggi')),
    done        INTEGER NOT NULL DEFAULT 0,    -- 0 = belum, 1 = selesai
    created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  )
`);

// ---------- Middleware ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- Validasi ----------
const PRIORITIES = ["rendah", "sedang", "tinggi"];

function validate(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || body.title !== undefined) {
    const title = String(body.title ?? "").trim();
    if (!title) errors.push("Judul tugas wajib diisi.");
    data.title = title;
  }
  if (!partial || body.deadline !== undefined) {
    const deadline = String(body.deadline ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) || isNaN(Date.parse(deadline))) {
      errors.push("Deadline wajib berformat YYYY-MM-DD.");
    }
    data.deadline = deadline;
  }
  if (body.course !== undefined) data.course = String(body.course).trim();
  if (body.description !== undefined) data.description = String(body.description).trim();
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) errors.push("Prioritas harus rendah, sedang, atau tinggi.");
    data.priority = body.priority;
  }
  if (body.done !== undefined) data.done = body.done ? 1 : 0;

  return { errors, data };
}

// ---------- Routes CRUD ----------

// READ semua (opsional filter ?status=selesai|belum & ?q=kata)
app.get("/api/tasks", (req, res) => {
  const { status, q } = req.query;
  const where = [];
  const params = [];
  if (status === "selesai") where.push("done = 1");
  if (status === "belum") where.push("done = 0");
  if (q) {
    where.push("(title LIKE ? OR course LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  const sql = `SELECT * FROM tasks ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY done ASC, deadline ASC, id DESC`;
  res.json(db.prepare(sql).all(...params));
});

// READ satu
app.get("/api/tasks/:id", (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!task) return res.status(404).json({ error: "Tugas tidak ditemukan." });
  res.json(task);
});

// CREATE
app.post("/api/tasks", (req, res) => {
  const { errors, data } = validate(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const info = db
    .prepare(
      `INSERT INTO tasks (title, course, description, deadline, priority)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      data.title,
      data.course ?? "",
      data.description ?? "",
      data.deadline,
      data.priority ?? "sedang"
    );
  const created = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(created);
});

// UPDATE (ubah sebagian atau seluruh field)
function updateHandler(req, res) {
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Tugas tidak ditemukan." });

  const { errors, data } = validate(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const merged = { ...existing, ...data };
  db.prepare(
    `UPDATE tasks SET title=?, course=?, description=?,
       deadline=?, priority=?, done=? WHERE id=?`
  ).run(
    merged.title,
    merged.course,
    merged.description,
    merged.deadline,
    merged.priority,
    merged.done,
    merged.id
  );
  res.json(db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id));
}
app.put("/api/tasks/:id", updateHandler);
app.patch("/api/tasks/:id", updateHandler);

// DELETE
app.delete("/api/tasks/:id", (req, res) => {
  const info = db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "Tugas tidak ditemukan." });
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Task Tracker berjalan di http://localhost:${PORT}`);
});