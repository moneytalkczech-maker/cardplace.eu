import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";
import logger from "../utils/logger";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

function onConnect(socket: AuthenticatedSocket) {
  const token = socket.handshake.auth.token;

  // Vyžadovat token pro všechny socket spojení
  if (!token) {
    logger.warn({ ip: socket.handshake.address }, "Socket.IO connection rejected: no token");
    socket.emit("error", { message: "Authentication required" });
    socket.disconnect();
    return;
  }

  try {
    const decoded = verifyToken(token);
    socket.userId = decoded.id;
    socket.username = decoded.username;
    logger.info({ userId: decoded.id }, "Socket.IO client authenticated");
  } catch (err) {
    logger.warn({ err }, "Socket.IO connection rejected: invalid token");
    socket.emit("error", { message: "Invalid authentication token" });
    socket.disconnect();
    return;
  }

  // Připojení k místnosti aukce (pouze autentizovaní uživatelé)
  socket.on("join-auction", (auctionId: string) => {
    if (!auctionId || typeof auctionId !== "string") return;
    socket.join(`auction-${auctionId}`);
  });

  socket.on("leave-auction", (auctionId: string) => {
    if (!auctionId || typeof auctionId !== "string") return;
    socket.leave(`auction-${auctionId}`);
  });

  // Připojení k osobní místnosti (pouze vlastní userId)
  socket.on("join-user", (_clientUserId: string) => {
    socket.join(`user-${socket.userId}`);
  });

  socket.on("disconnect", () => {
    logger.info({ userId: socket.userId }, "Socket.IO client disconnected");
  });
}

export function initSocket(server: HTTPServer) {
  const origin = process.env.CORS_ORIGIN;
  if (!origin) {
    throw new Error("CORS_ORIGIN environment variable is required for Socket.IO");
  }
  const io = new Server(server, {
    cors: { origin, methods: ["GET", "POST"], credentials: true },
  });

  io.on("connection", onConnect);

  return io;
}
