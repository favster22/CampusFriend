import { io } from "socket.io-client";

let socket = null;

export const initSocket = (token) => {
  if (socket) socket.disconnect();

  const socketUrl = import.meta.env.VITE_API_URL || "/";

  socket = io(socketUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => console.log("🔗 Socket connected:", socket.id));
  socket.on("disconnect", (reason) => console.log("🔌 Socket disconnected:", reason));
  socket.on("connect_error", (err) => console.error("Socket error:", err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};