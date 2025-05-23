require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

app.use(cors());
app.use(bodyParser.json());

let users = []; // In-memory user store
let allAvailabilities = [];

// Helper middleware to check JWT
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.email === decoded.email);
    if (!user) return res.sendStatus(401);
    req.user = user;
    next();
  } catch (err) {
    res.sendStatus(403);
  }
}

// --- Auth routes ---

// Register
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: "Email already exists" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    name,
    email,
    passwordHash,
    activity: {
      lastLogin: null,
      lastViewed: null,
      lastEdited: null,
      loginCount: 0,
      viewCount: 0,
      editCount: 0
    }
  };
  users.push(newUser);
  res.json({ message: "Registered successfully" });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  user.activity.lastLogin = new Date();
  user.activity.loginCount += 1;

  const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, name: user.name });
});

// --- Availability routes ---

app.post("/availability", authenticate, (req, res) => {
  const user = req.user;
  const availability = req.body.availability;

  if (!availability) {
    return res.status(400).json({ error: "Availability required" });
  }

  // Remove old entries
  allAvailabilities = allAvailabilities.filter((a) => a.user !== user.email);
  allAvailabilities.push({ user: user.email, availability });

  user.activity.lastEdited = new Date();
  user.activity.editCount += 1;

  res.json({ message: "Availability saved", allAvailabilities });
});

app.get("/availability", authenticate, (req, res) => {
  req.user.activity.lastViewed = new Date();
  req.user.activity.viewCount += 1;

  res.json(allAvailabilities);
});

app.get("/availability/aggregate", authenticate, (req, res) => {
  req.user.activity.lastViewed = new Date();
  req.user.activity.viewCount += 1;

  const slotCounts = {};
  allAvailabilities.forEach(({ availability }) => {
    availability.forEach(({ day, hour }) => {
      const key = `${day}_${hour}`;
      slotCounts[key] = (slotCounts[key] || 0) + 1;
    });
  });

  const sorted = Object.entries(slotCounts)
    .map(([key, count]) => {
      const [day, hour] = key.split("_").map(Number);
      return { day, hour, count };
    })
    .sort((a, b) => b.count - a.count);

  res.json(sorted);
});

// View activity
app.get("/user/activity", authenticate, (req, res) => {
  res.json(req.user.activity);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
