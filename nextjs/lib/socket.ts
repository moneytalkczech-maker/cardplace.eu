"use client";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:3001");

function createSocket(token?: string): Socket {
  return io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    auth: { token: token || undefined },
  });
}

export function connectSocket(token: string) {
  if (!token) return;
  const currentAuth = socket?.auth as { token?: string } | undefined;
  if (!socket || currentAuth?.token !== token) {
    if (socket) {
      socket.disconnect();
      socket.removeAllListeners();
    }
    socket = createSocket(token);
    socket.io.on("reconnect_attempt", () => {
      if (socket) socket.auth = { token };
    });
  }
  if (!socket.connected) socket.connect();
}

export function disconnectSocket() {
  socket?.disconnect();
}

export function getSocket(): Socket | null {
  return socket;
}

export function joinAuction(auctionId: string) {
  if (socket?.connected) socket.emit("join-auction", auctionId);
}

export function leaveAuction(auctionId: string) {
  if (socket?.connected) socket.emit("leave-auction", auctionId);
}

export function joinUser() {
  if (socket?.connected) socket.emit("join-user");
}

interface BidEvent {
  id: string;
  amount: number;
  auctionId: string;
  userId: string;
  username: string;
  createdAt: string;
}

interface OutbidEvent {
  auctionId: string;
  auctionTitle: string;
  newBid: number;
}

export function onNewBid(callback: (data: BidEvent) => void) {
  if (!socket) return () => {};
  socket.on("new-bid", callback);
  return () => { socket!.off("new-bid", callback); };
}

export function onOutbid(callback: (data: OutbidEvent) => void) {
  if (!socket) return () => {};
  socket.on("outbid", callback);
  return () => { socket!.off("outbid", callback); };
}
