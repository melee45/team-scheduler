const jwt = require("jsonwebtoken");
const prisma = require("./prismaClient"); // adjust path if needed
const JWT_SECRET = process.env.JWT_SECRET;

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userEmail = decoded.email;

    // Update lastActivity on every authenticated request
    await prisma.user.update({
      where: { email: decoded.email },
      data: { lastActivity: new Date() },
    });

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = authenticate;
