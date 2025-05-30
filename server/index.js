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

// Setup nodemailer transporter using your .env EMAIL_USER and EMAIL_PASS
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- JWT Middleware ---
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userEmail = decoded.email;
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


    // Send welcome email
    await transporter.sendMail({
      from: `"Scheduler App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Scheduler App!",
      text: `Hello! You've successfully registered with Scheduler App.`,
      html: `
        <h3>Welcome to Scheduler App!</h3>
        <p>Your registration was successful. You can now <a href="http://localhost:3000/login">log in here</a> and set your availability.</p>
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
    data: {
      lastLogin: new Date(),
    },
  });

  const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, name: user.name || user.email });
});

// --- Request Password Reset ---
app.post("/request-password-reset", async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // To avoid email enumeration, send success message regardless
    return res.status(200).json({ message: "If your email exists, a reset link will be sent." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

  await prisma.user.update({
    where: { email },
    data: {
      resetToken: token,
      resetTokenExp: expires,
    },
  });

  const resetLink = `http://localhost:3000/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Scheduler App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset",
    text: `Reset your password by clicking the following link: ${resetLink}`,
    html: `<p>Reset your password by clicking <a href="${resetLink}">this link</a>.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`🔗 Password reset link sent to ${email}`);
  } catch (err) {
    console.error("Error sending email:", err);
  }

  res.json({ message: "Password reset link sent if email exists." });
});

// --- Reset Password ---
app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExp: {
        gte: new Date(),
      },
    },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashed,
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

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActivity: new Date() },
    });

    const updated = await prisma.availability.findMany();
    const allAvailabilities = groupByUser(updated);

    res.json({ message: "Availability saved", allAvailabilities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save availability" });
  }
});

// --- Get User Availability ---
app.get("/availability", authenticate, async (req, res) => {
  const all = await prisma.availability.findMany({
    include: { user: true },
  });

  const grouped = groupByUser(all);
  res.json(grouped);
});

// --- Aggregated Availability ---
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

// --- View Activity (optional) ---
app.get("/user/activity", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.userEmail } });
  if (!user) return res.sendStatus(404);

  res.json({
    lastLogin: user.lastLogin,
    lastActivity: user.lastActivity,
  });
});

// --- Helpers ---
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
  console.log(`Server running on http://localhost:${PORT}`);
});
