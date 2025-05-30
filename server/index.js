require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const PORT = 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

app.use(cors());
app.use(bodyParser.json());

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- JWT Middleware with activity tracking ---
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userEmail = decoded.email;

    // Update lastActivity
    await prisma.user.update({
      where: { email: decoded.email },
      data: { lastActivity: new Date() },
    });

    next();
  } catch (err) {
    res.sendStatus(403);
  }
}

// --- Register ---
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ error: "Email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        createdAt: new Date(),
      },
    });

    await transporter.sendMail({
      from: `"Scheduler App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Scheduler App!",
      html: `
        <h3>Welcome to Scheduler App!</h3>
        <p>Your registration was successful. You can now <a href="http://localhost:3000/login">log in</a>.</p>
      `,
    });

    res.json({ message: "Registered successfully. Please check your email." });
  } catch (err) {
    console.error("Registration failed:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// --- Login ---
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  await prisma.user.update({
    where: { email },
    data: { lastLogin: new Date() },
  });

  const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, name: user.name || user.email });
});

// --- Request Password Reset ---
app.post("/request-password-reset", async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExp: expires,
      },
    });

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    await transporter.sendMail({
      from: `"Scheduler App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset",
      html: `<p>Reset your password <a href="${resetLink}">here</a>.</p>`,
    });
  }

  res.json({ message: "Password reset link sent if email exists." });
});

// --- Reset Password ---
app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExp: { gte: new Date() },
    },
  });

  if (!user) return res.status(400).json({ error: "Invalid or expired token" });

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExp: null,
    },
  });

  res.json({ message: "Password has been reset." });
});

// --- Save Availability ---
app.post("/availability", authenticate, async (req, res) => {
  const { availability } = req.body;

  const user = await prisma.user.findUnique({ where: { email: req.userEmail } });
  if (!user) return res.sendStatus(401);

  try {
    await prisma.availability.deleteMany({ where: { userId: user.id } });

    const data = availability.map(({ day, hour }) => ({
      userId: user.id,
      day,
      hour,
    }));

    await prisma.availability.createMany({ data });

    const updated = await prisma.availability.findMany({ include: { user: true } });
    res.json({ message: "Availability saved", allAvailabilities: groupByUser(updated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save availability" });
  }
});

// --- Get All Availability ---
app.get("/availability", authenticate, async (req, res) => {
  const all = await prisma.availability.findMany({ include: { user: true } });
  res.json(groupByUser(all));
});

// --- Aggregate Availability ---
app.get("/availability/aggregate", authenticate, async (req, res) => {
  const all = await prisma.availability.findMany();

  const slotCounts = {};
  all.forEach(({ day, hour }) => {
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
});

// --- View Your Activity ---
app.get("/user/activity", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.userEmail } });
  if (!user) return res.sendStatus(404);

  res.json({
    lastLogin: user.lastLogin,
    lastActivity: user.lastActivity,
  });
});

// --- NEW: View All Users' Online Status ---
app.get("/users/online-status", authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        lastLogin: true,
        lastActivity: true,
      },
    });

    const now = new Date();
    const status = users.map((user) => {
      const lastActivity = user.lastActivity ? new Date(user.lastActivity) : null;
      const isOnline = lastActivity && now - lastActivity < 5 * 60 * 1000;

      return {
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin,
        lastActivity: user.lastActivity,
        timeSinceLastActivity: lastActivity ? msToTime(now - lastActivity) : "Never",
        status: isOnline ? "online" : "offline",
      };
    });

    res.json(status);
  } catch (err) {
    console.error("Failed to fetch online status", err);
    res.status(500).json({ error: "Could not fetch user status" });
  }
});

// --- Helper: Time Difference ---
function msToTime(ms) {
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${days}d ${hours}h ${minutes}m`;
}

// --- Helper: Group Availabilities by User ---
function groupByUser(entries) {
  const grouped = {};
  entries.forEach((entry) => {
    const email = entry.user?.email || "unknown";
    if (!grouped[email]) grouped[email] = { user: email, availability: [] };
    grouped[email].availability.push({ day: entry.day, hour: entry.hour });
  });
  return Object.values(grouped);
}

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
