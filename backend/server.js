const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const User = require("./models/User");

const app = express();
const cors = require("cors");

app.use(
  cors({
    origin: true, // Or put your exact Netlify frontend URL here
    credentials: true, // MANDATORY so your JWT authentication cookie can be sent back and forth
  }),
);
const PORT = process.env.PORT || 5000;
const JWT_SECRET =
  process.env.JWT_SECRET || "bitfoniz_institutional_secret_2026";

app.use(express.json());
app.use(cookieParser());

// Explicit route for homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.use(
  express.static(path.join(__dirname, "../public"), { extensions: ["html"] }),
);

// MongoDB Connection
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://midejohnson04_db_user:Johnsonjr217@cluster0.bmmizao.mongodb.net/bitfoniz_holdings?retryWrites=true&w=majority";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully."))
  .catch((err) => console.error("MongoDB connection error:", err));

// Auth Middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ error: "Access denied. Please sign in." });
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid authentication token." });
  }
};

// --- AUTH ROUTES ---
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const isAdmin = email === "admin@bitfoniz.com" ? true : false;

    user = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin,
      principal: 0,
      balance: 0,
      transactions: [],
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.cookie("token", token, { httpOnly: true });

    res.json({
      message: "Account created successfully!",
      isAdmin: user.isAdmin,
    });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid email or password." });

    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 86400000,
    });

    res.json({
      message: "Logged in successfully",
      isAdmin: user.isAdmin,
      user: {
        name: user.name,
        email: user.email,
        principal: user.principal,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

// --- USER PROFILE & TRANSACTION ROUTES ---
app.get("/api/user/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/user/deposit", verifyToken, async (req, res) => {
  try {
    const { amount, cryptoType, txHash } = req.body;
    if (!amount || !cryptoType || !txHash) {
      return res
        .status(400)
        .json({
          error: "Please provide amount, crypto type, and transaction hash.",
        });
    }

    const user = await User.findById(req.user.id);
    user.transactions.push({
      amount: Number(amount),
      cryptoType,
      txHash,
      status: "Pending",
    });

    await user.save();
    res.json({
      message:
        "Deposit request submitted successfully! Awaiting institutional network confirmation.",
    });
  } catch (err) {
    res.status(500).json({ error: "Server error submitting deposit" });
  }
});

// --- ADMIN OVERSIGHT ROUTES ---
app.get("/api/admin/deposits", verifyToken, async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || !adminUser.isAdmin)
      return res.status(403).json({ error: "Unauthorized" });

    const clients = await User.find({ isAdmin: false }).select("-password");
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put(
  "/api/admin/deposit/:userId/:txId/approve",
  verifyToken,
  async (req, res) => {
    try {
      const adminUser = await User.findById(req.user.id);
      if (!adminUser || !adminUser.isAdmin)
        return res.status(403).json({ error: "Unauthorized" });

      const client = await User.findById(req.params.userId);
      if (!client) return res.status(404).json({ error: "Client not found" });

      const tx = client.transactions.id(req.params.txId);
      if (!tx) return res.status(404).json({ error: "Transaction not found" });

      if (tx.status === "Approved") {
        return res.status(400).json({ error: "Transaction already approved." });
      }

      tx.status = "Approved";
      client.balance = (client.balance || 0) + tx.amount;
      await client.save();

      res.json({
        message: "Deposit approved and client balance updated successfully!",
        balance: client.balance,
      });
    } catch (err) {
      res.status(500).json({ error: "Server error approving deposit" });
    }
  },
);

app.listen(PORT, () => console.log(`Bitfoniz server running on port ${PORT}`));
