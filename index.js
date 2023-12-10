const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const port = 3000;

// Initialize SQLite Database
const dbPath = path.resolve(__dirname, "rsvp.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  } else {
    console.log("Connected to the SQLite database.");
    db.run(
      `CREATE TABLE IF NOT EXISTS rsvp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name text, 
            adults integer, 
            children integer
        )`,
      (err) => {
        if (err) {
          // Table already created
        } else {
          console.log("Table just created");
        }
      }
    );
  }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/submit", (req, res) => {
  const { name, adults, children } = req.body;
  const insert = "INSERT INTO rsvp (name, adults, children) VALUES (?,?,?)";
  db.run(insert, [name, adults, children], (err) => {
    if (err) {
      return console.error(err.message);
    }
    db.all("SELECT * FROM rsvp", [], (err, rows) => {
      if (err) {
        throw err;
      }

      let totalAttendees = rows.reduce((acc, row) => acc + row.adults + row.children, 0);
      let responseHtml = rows.map((row) => `<p>${row.name} - Adults: ${row.adults}, Children: ${row.children}</p>`).join("");
      responseHtml += `<p>Total Attendees: ${totalAttendees}</p>`;
      res.send(responseHtml);
    });
  });
});

// Add this new route to your server.js

app.get("/rsvps", (req, res) => {
  db.all("SELECT * FROM rsvp", [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }

    let totalAttendees = rows.reduce((acc, row) => acc + row.adults + row.children, 0);
    let responseHtml = rows.map((row) => `<p>${row.name} - Adults: ${row.adults}, Children: ${row.children}</p>`).join("");
    responseHtml += `<p>Total Attendees: ${totalAttendees}</p>`;
    res.send(responseHtml);
  });
});

app.post("/clear", (req, res) => {
  db.run("DELETE FROM rsvp", [], (err) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    res.send("Cleared");
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
