require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const app = require("./app");
const { handleSocketConnection } = require("./controllers/socketController");

const allowedOrigins = [
  "http://localhost:5173",
  "https://campus-friend.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => handleSocketConnection(io, socket));

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Campusfriend server running on port ${PORT}`);
});

module.exports = { app, io };