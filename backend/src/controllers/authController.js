const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const generateToken = require("../utils/generateToken");

// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    // role is optional; only allow ADMIN if explicitly passed (in real prod,
    // gate this behind an invite code / manual promotion instead)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role === "ADMIN" ? "ADMIN" : "STUDENT" },
    });

    const token = generateToken(user.id);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user.id);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getMe };