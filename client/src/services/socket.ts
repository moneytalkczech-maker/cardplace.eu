import { io } from "socket.io-client";

// Create socket with JWT token in handshake auth
function getSocket() {
  const token = localStorage.getItem("token");
  
  return io({
    autoConnect: false,
    transports: ["websocket", "polling"],
    auth: {
      token: token || undefined,
    },
  });
}

const socket = getSocket();

export function connectSocket() {
  if (!socket.connected) {
    // Refresh token before connecting (in case it was updated)
    const token = localStorage.getItem("token");
    socket.auth = { token: token || undefined };
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

export function joinAuction(auctionId: string) {
  socket.emit("join-auction", auctionId);
}

export function leaveAuction(auctionId: string) {
  socket.emit("leave-auction", auctionId);
}

// Client no longer needs to send userId - server extracts it from JWT
export function joinUser() {
  socket.emit("join-user");
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
  socket.on("new-bid", callback);
  return () => { socket.off("new-bid", callback); };
}

export function onOutbid(callback: (data: OutbidEvent) => void) {
  socket.on("outbid", callback);
  return () => { socket.off("outbid", callback); };
}

export default socket;
