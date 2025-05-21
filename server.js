const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./bookings.db', (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to SQLite DB.');
});

db.run(`CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  company TEXT,
  pos TEXT,
  collection INTEGER,
  notes TEXT,
  status TEXT,
  handball TEXT
)`);

app.get('/bookings', (req, res) => {
  db.all(`SELECT * FROM bookings`, [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

app.post('/bookings', (req, res) => {
  const { id, company, pos, collection, notes, status, handball } = req.body;
  const stmt = db.prepare(`REPLACE INTO bookings (id, company, pos, collection, notes, status, handball)
                           VALUES (?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(id, company, pos, collection, notes, status, handball, (err) => {
    if (err) return res.status(500).send(err.message);
    res.send({ success: true });
  });
});

app.delete('/bookings/:id', (req, res) => {
  db.run(`DELETE FROM bookings WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).send(err.message);
    res.send({ deleted: this.changes });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
