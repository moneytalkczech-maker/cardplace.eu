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
  if (token) {
    try {
      const decoded = verifyToken(token);
      socket.userId = decoded.id;
      socket.username = decoded.username;
    } catch (err) {
      logger.warn({ err }, "Socket.IO auth failed");
      socket.disconnect();
      return;
    }
  }

  socket.on("join-auction", (auctionId: string) => {
    socket.join(`auction-${auctionId}`);
  });

  socket.on("leave-auction", (auctionId: string) => {
    socket.leave(`auction-${auctionId}`);
  });

  socket.on("join-user", (_clientUserId: string) => {
    if (!socket.userId) {
      logger.warn("Attempted join-user without authentication");
      return;
    }
    socket.join(`user-${socket.userId}`);
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