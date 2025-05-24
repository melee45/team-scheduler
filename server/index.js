require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("./prismaClient");

const app = express();
const PORT = 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

app.use(cors());
app.use(bodyParser.json());

// Helper middleware to check JWT and set req.user
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Find user by id from token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
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
  const { email, password } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update lastLogin and increment loginCount (simulate loginCount via custom metadata, or skip)
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Availability routes ---

// Save/update availability
app.post("/availability", authenticate, async (req, res) => {
  const userId = req.user.id;
  const availability = req.body.availability;

  if (!availability || !Array.isArray(availability)) {
    return res.status(400).json({ error: "Availability is required and must be an array" });
  }

  try {
    // Delete old availability for user
    await prisma.availability.deleteMany({ where: { userId } });

    // Insert new availability
    const createManyData = availability.map(({ day, hour }) => ({
      userId,
      day,
      hour,
    }));

    await prisma.availability.createMany({ data: createManyData });

    // Update lastActivity
    await prisma.user.update({
      where: { id: userId },
      data: { lastActivity: new Date() },
    });

    res.json({ message: "Availability saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get availability for logged-in user
app.get("/availability", authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    const availability = await prisma.availability.findMany({ where: { userId } });

    // Update lastViewed
    await prisma.user.update({
      where: { id: userId },
      data: { lastActivity: new Date() },
    });

    res.json(availability);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get aggregated availability counts (public)
app.get("/availability/aggregate", async (req, res) => {
  try {
    const allAvailabilities = await prisma.availability.findMany();
    const slotCounts = {};

    allAvailabilities.forEach(({ day, hour }) => {
      const key = `${day}_${hour}`;
      slotCounts[key] = (slotCounts[key] || 0) + 1;
    });

    const sorted = Object.entries(slotCounts)
      .map(([key, count]) => {
        const [day, hour] = key.split("_").map(Number);
        return { day, hour, count };
      })
      .sort((a, b) => b.count - a.count);

    res.json(sorted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// User activity summary
app.get("/user/activity", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        createdAt: true,
        lastLogin: true,
        lastActivity: true,
      },
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
