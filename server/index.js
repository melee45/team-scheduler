const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

let allAvailabilities = []; // In-memory store of availabilities

app.post("/availability", (req, res) => {
  const { user, availability } = req.body;

  if (!user || !availability) {
    return res.status(400).json({ error: "User and availability required" });
  }

  // Remove any existing availability for this user
  allAvailabilities = allAvailabilities.filter((a) => a.user !== user);

  allAvailabilities.push({ user, availability });

  res.json({ message: "Availability saved", allAvailabilities });
});

app.get("/availability", (req, res) => {
  res.json(allAvailabilities);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
