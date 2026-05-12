require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");


const authRoutes = require("./routes/index");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const communityRoutes = require("./routes/communityRoutes");
const feedRoutes = require("./routes/feedRoutes.js");

const { protect } = require("./middleware/authMiddleware");
const { handleSocketConnection } = require("./controllers/socketController");

const app = express();

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://campus-friend.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(
  cors({
    origin: ["http://localhost:5173", "https://campus-friend.vercel.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", protect, userRoutes);
app.use("/api/messages", protect, messageRoutes);
app.use("/api/communities", protect, communityRoutes);
app.use("/api/feed", protect, feedRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));
  const jwt = require("jsonwebtoken");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => handleSocketConnection(io, socket));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Campusfriend server running on port ${PORT}`);
});

module.exports = { app, io };