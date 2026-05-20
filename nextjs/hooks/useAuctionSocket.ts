"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { connectSocket, joinAuction, leaveAuction, onNewBid } from "@/lib/socket";

interface BidEvent {
  id: string;
  amount: number;
  auctionId: string;
  userId: string;
  username: string;
  createdAt: string;
}

export function useAuctionSocket(auctionId: string, onBid: (bid: BidEvent) => void) {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!auctionId) return;
    if (token) connectSocket(token);
    joinAuction(auctionId);
    const off = onNewBid(onBid);
    return () => {
      off();
      leaveAuction(auctionId);
    };
  }, [auctionId, token]);
}
