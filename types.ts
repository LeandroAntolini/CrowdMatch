export const GENDERS = ["Homem", "Mulher", "Não-binário", "Outro"];
export const SEXUAL_ORIENTATIONS = ["Heterossexual", "Homossexual", "Bissexual", "Pansexual", "Assexual", "Outro"];

export interface MatchPreferences {
  genders: string[];
  sexualOrientations: string[];
}

export interface User {
  id: string;
  name: string;
  age: number;
  bio: string;
  interests: string[];
  photos: string[];
  isAvailableForMatch: boolean;
  email: string;
  phone?: string;
  gender: string;
  sexualOrientation: string;
  matchPreferences: MatchPreferences;
  city?: string;
  state?: string;
  role?: string;
  isSimplified?: boolean;
}

export interface Place {
  id: string;
  name:string;
  address: string;
  category: string;
  rating: number;
  photoUrl: string;
  distance: number;
  isOpen: boolean;
  lat: number;
  lng: number;
  city: string;
  state: string;
}

export interface CheckIn {
  userId: string;
  placeId: string;
  timestamp: number;
  createdAt: string;
}

export interface GoingIntention {
  userId: string;
  placeId: string;
  timestamp: number;
  createdAt: string;
}

export interface Match {
  id: string;
  userIds: string[];
  createdAt: string;
  otherUser?: User;
  lastMessage?: string;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export type PromotionType = 'FIRST_N_GOING' | 'FIRST_N_CHECKIN';

export interface Promotion {
  id: string;
  placeId: string;
  placeName: string;
  placePhotoUrl?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  promotionType: PromotionType;
  limitCount: number;
  createdBy?: string;
  createdAt: string;
}

export interface PromotionClaim {
  id: string;
  promotionId: string;
  userId: string;
  claimedAt: string;
  status: 'claimed' | 'redeemed' | 'expired';
  promotion?: Promotion;
}

export interface PostLike {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

export interface PostComment {
  id: string;
  userId: string;
  postId: string;
  content: string;
  createdAt: string;
  profiles: {
    name: string;
  };
}

export interface FeedPost {
  id: string;
  placeId: string;
  placeName: string;
  placeLogoUrl: string;
  type: 'image' | 'video' | 'live-highlight';
  mediaUrl: string;
  caption: string;
  likes: number;
  comments: PostComment[];
  timestamp: string;
  isLikedByCurrentUser?: boolean;
}

// Novos Tipos: Cardápio e Pedidos
export interface MenuItem {
  id: string;
  place_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
}

export type OrderStatus = 'pending' | 'preparing' | 'delivered' | 'paid' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  menu_item?: MenuItem;
}

export interface Order {
  id: string;
  place_id: string;
  user_id: string;
  table_number: number;
  status: OrderStatus;
  total_price: number;
  created_at: string;
  order_items?: OrderItem[];
  profiles?: {
    name: string;
    phone: string;
  };
}