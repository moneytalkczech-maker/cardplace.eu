export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  trustScore: number;
  verified: boolean;
  verifiedType?: string;
  founder?: boolean;
  vip?: boolean;
  vipUntil?: string;
  avatarUrl?: string;
  totalSales?: number;
  auctionCount?: number;
  bidCount?: number;
  wonCount?: number;
  createdAt?: string;
  rank?: string;
  rankLabel?: string;
  credits?: number;
}

export interface MonetizationPrices {
  vipMonthly: number;
  vipYearly: number;
  verifiedPrice: number;
  boostTop: number;
  boostHomepage: number;
  boostHighlight: number;
  boostSocial: number;
  feePhase: string;
}

export interface Card {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  cardNumber?: string;
  rarity?: string;
  imageUrl?: string;
  estimatedPrice?: number;
}

export interface Auction {
  id: string;
  title: string;
  description?: string;
  condition?: string;
  imageUrl?: string;
  startingPrice: number;
  currentPrice: number;
  minIncrement: number;
  endTime: string;
  status: string;
  featured: boolean;
  buyNowPrice?: number;
  buyNowUsed?: boolean;
  createdAt: string;
  userId: string;
  cardId?: string;
  user: { id: string; username: string; trustScore: number; rank?: string } & Partial<{ verified: boolean; totalSales: number; createdAt: string }>;
  card?: Card;
  bids?: Bid[];
  bidCount?: number;
  watchCount?: number;
  isWatched?: boolean;
  _count?: { bids: number; watchlists: number };
  trendingRank?: number;
}

export interface Bid {
  id: string;
  amount: number;
  maxBid?: number;
  createdAt: string;
  userId: string;
  auctionId: string;
  user?: { id: string; username: string };
  auction?: {
    id: string;
    title: string;
    currentPrice: number;
    endTime: string;
    status: string;
    imageUrl?: string;
    card?: { name: string; imageUrl?: string };
  };
}

export interface WatchlistItem {
  id: string;
  auction: Auction;
  createdAt: string;
}

export interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  auction: {
    title: string;
    card?: { name: string; setName: string; imageUrl?: string };
  };
  buyer: { username: string };
}
