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
}

export interface GoingIntention {
  userId: string;
  placeId: string;
  timestamp: number;
}

export interface Match {
  id: string;
  userIds: [string, string];
  timestamp: number;
  lastMessage?: string;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  timestamp: number;
}