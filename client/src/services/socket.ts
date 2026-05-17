import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

let socket: Socket | null = null;

// V produkci se socket.io připojuje k API serveru (jiný origin než frontend)
// V developmentu používá Vite proxy → připojení na stejný origin stačí
const API_URL = import.meta.env.VITE_API_URL || "";
const SOCKET_URL = API_URL ? API_URL.replace(/\/api\/?$/, "") : undefined;

// Vytvořit novou socket instanci s aktuálním tokenem
function createSocket(): Socket {
  const token = useAuthStore.getState().token;
  return io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    auth: { token: token || undefined },
  });
}

export function connectSocket() {
  const token = useAuthStore.getState().token;
  if (!token) return; // No token — cannot authenticate

  // Pokud socket neexistuje nebo má starý token, vytvořit nový
  const currentAuth = socket?.auth as { token?: string } | undefined;
  if (!socket || currentAuth?.token !== token) {
    if (socket) {
      socket.disconnect();
      socket.removeAllListeners();
    }
    socket = createSocket();

    // Při reconnectu vždy aktualizovat token
    socket.io.on("reconnect_attempt", () => {
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        socket!.auth = { token: currentToken };
      }
    });
  }

  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
  }
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

interface ProxyBidEvent {
  auctionId: string;
  auctionTitle: string;
  newBid: number;
  maxBid: number;
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

export function onProxyBid(callback: (data: ProxyBidEvent) => void) {
  if (!socket) return () => {};
  socket.on("proxy-bid", callback);
  return () => { socket!.off("proxy-bid", callback); };
}

export default socket;
