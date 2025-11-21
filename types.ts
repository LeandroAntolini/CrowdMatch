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
  role?: 'user' | 'owner';
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
  hasPromotion?: boolean;
}

export interface CheckIn {
  userId: string;
  placeId: string;
  timestamp: number;
}

export interface GoingIntention {
  userId: string;
  placeId: string;
  timestamp: number;
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

export interface Promotion {
    id: string;
    place_id: string;
    place_name: string;
    place_photo_url: string;
    title: string;
    description: string | null;
    end_date: string;
}