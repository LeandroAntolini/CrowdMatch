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
  gender: string;
  sexualOrientation: string;
  matchPreferences: MatchPreferences;
  city?: string;
  state?: string;
  role?: string;
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
  createdAt: string; // Adicionado para ordenação precisa
}

export interface GoingIntention {
  userId: string;
  placeId: string;
  timestamp: number;
  createdAt: string; // Adicionado para ordenação precisa
}

export interface Match {
  id: string;
  userIds: string[];
  createdAt: string;
  otherUser?: User; // Adicionado para conveniência da UI
  lastMessage?: string; // Temporariamente mantido para UI
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
  promotion?: Promotion; // Para conveniência
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

// Tipos para o Feed
// LivePostInFeed is now defined in AppContext as LivePost
export interface FeedPost {
  id: string;
  placeId: string;
  placeName: string;
  placeLogoUrl: string;
  type: 'image' | 'video' | 'live-highlight';
  mediaUrl: string;
  caption: string;
  likes: number; // Agora é a contagem total
  comments: PostComment[]; // Agora é um array de PostComment
  timestamp: string;
  isLikedByCurrentUser?: boolean; // Novo campo para estado da UI
}