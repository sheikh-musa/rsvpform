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
    name TEXT UNIQUE, 
    adults INTEGER, 
    children INTEGER
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

// Function to generate the table
const generateTable = (res) => {
  db.all("SELECT * FROM rsvp", [], (err, rows) => {
    if (err) {
      throw err;
    }

    let totalAdults = rows.reduce((acc, row) => acc + row.adults, 0);
    let totalChildren = rows.reduce((acc, row) => acc + row.children, 0);
    let totalAttendees = totalAdults + totalChildren;

    let tableHtml = `<table><tr><th>Name</th><th>Adults</th><th>Children</th></tr>`;
    rows.forEach((row) => {
      tableHtml += `<tr><td>${row.name}</td><td>${row.adults}</td><td>${row.children}</td></tr>`;
    });
    tableHtml += `<tr><td><strong>Totals</strong></td><td>${totalAdults}</td><td>${totalChildren}</td></tr>`;
    tableHtml += `</table><p>Total Attendees: ${totalAttendees}</p>`;

    res.send(tableHtml);
  });
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/rsvps", (req, res) => {
  generateTable(res);
});

app.post("/submit", (req, res) => {
  const { name, adults, children } = req.body;
  const insert = "INSERT INTO rsvp (name, adults, children) VALUES (?,?,?)";
  db.run(insert, [name, adults, children], (err) => {
    if (err) {
      return console.error(err.message);
    }
    generateTable(res);
  });
});

// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "index.html"));
// });

// app.post("/submit", (req, res) => {
//   const { name, adults, children } = req.body;
//   const insert = "INSERT INTO rsvp (name, adults, children) VALUES (?,?,?)";
//   db.run(insert, [name, adults, children], (err) => {
//     if (err) {
//       return console.error(err.message);
//     }
//     db.all("SELECT * FROM rsvp", [], (err, rows) => {
//       if (err) {
//         throw err;
//       }

//       let totalAdults = rows.reduce((acc, row) => acc + row.adults, 0);
//       let totalChildren = rows.reduce((acc, row) => acc + row.children, 0);
//       let totalAttendees = totalAdults + totalChildren;

//       let tableHtml = `<table><tr><th>Name</th><th>Adults</th><th>Children</th></tr>`;
//       rows.forEach((row) => {
//         tableHtml += `<tr><td>${row.name}</td><td>${row.adults}</td><td>${row.children}</td></tr>`;
//       });
//       tableHtml += `<tr><td><strong>Totals</strong></td><td>${totalAdults}</td><td>${totalChildren}</td></tr>`;
//       tableHtml += `</table><p>Total Attendees: ${totalAttendees}</p>`;

//       res.send(tableHtml);
//     });
//   });
// });

// app.get("/rsvps", (req, res) => {
//   db.all("SELECT * FROM rsvp", [], (err, rows) => {
//     if (err) {
//       res.status(500).send(err.message);
//       return;
//     }

//     let totalAttendees = rows.reduce((acc, row) => acc + row.adults + row.children, 0);
//     let responseHtml = rows.map((row) => `<p>${row.name} - Adults: ${row.adults}, Children: ${row.children}</p>`).join("");
//     responseHtml += `<p>Total Attendees: ${totalAttendees}</p>`;
//     res.send(responseHtml);
//   });
// });

app.post("/clear", (req, res) => {
  db.run("DELETE FROM rsvp", [], (err) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    res.send("Cleared");
  });
});

app.post("/reset-table", (req, res) => {
  const dropSql = "DROP TABLE IF EXISTS rsvp";
  const createSql = `CREATE TABLE rsvp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE, 
        adults INTEGER, 
        children INTEGER
    )`;

  db.run(dropSql, (err) => {
    if (err) {
      res.status(500).send("Error dropping table: " + err.message);
      return;
    }

    db.run(createSql, (err) => {
      if (err) {
        res.status(500).send("Error creating table: " + err.message);
        return;
      }
      res.send("Table reset successfully");
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
