"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { User, Place, CheckIn, Match, Message, GoingIntention, Promotion, PromotionClaim, PromotionType, FeedPost, PostComment, Order } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

interface Favorite {
    id: string;
    userId: string;
    placeId: string;
}

export interface LivePost {
    id: string;
    user_id: string;
    place_id: string;
    content: string;
    created_at: string;
    profiles: Pick<User, 'id' | 'name' | 'photos'> & { role?: string };
}

interface ClaimResult {
    success: boolean;
    message: string;
    isWinner: boolean;
    claimOrder?: number;
    claimId?: string;
}

interface CreatePostPayload {
    placeId: string;
    caption: string;
    mediaUrl: string;
    type: 'image' | 'video' | 'live-highlight';
}

interface CreatePromotionPayload {
    title: string;
    description?: string;
    placeId: string;
    placeName: string;
    placePhotoUrl?: string;
    promotionType: PromotionType;
    limitCount: number;
    startDate: string;
    endDate: string;
}

const mapPostComment = (c: any): PostComment => ({
    id: c.id,
    userId: c.user_id,
    postId: c.post_id,
    content: c.content,
    createdAt: c.created_at,
    profiles: c.profiles,
});

const mapProfileToUser = (profileData: any, sessionUser: SupabaseUser | null): User => {
    return {
        id: profileData.id,
        email: sessionUser?.email || '',
        name: profileData.name,
        age: profileData.age,
        bio: profileData.bio,
        interests: profileData.interests,
        photos: profileData.photos,
        gender: profileData.gender,
        sexualOrientation: profileData.sexual_orientation,
        matchPreferences: profileData.match_preferences,
        city: profileData.city,
        state: profileData.state,
        isAvailableForMatch: profileData.is_available_for_match,
        role: profileData.role,
    };
};

const mapPromotion = (p: any): Promotion => ({
    id: p.id,
    placeId: p.place_id,
    placeName: p.place_name,
    placePhotoUrl: p.place_photo_url,
    title: p.title,
    description: p.description,
    startDate: p.start_date,
    endDate: p.end_date,
    promotionType: p.promotion_type,
    limitCount: p.limit_count,
    createdBy: p.created_by,
    createdAt: p.created_at,
});

const mapClaim = (c: any): PromotionClaim => ({
    id: c.id,
    promotionId: c.promotion_id,
    userId: c.user_id,
    claimedAt: c.claimed_at,
    status: c.status,
    promotion: c.promotions ? mapPromotion(c.promotions) : undefined,
});

interface AppContextType {
    isAuthenticated: boolean;
    hasOnboarded: boolean;
    currentUser: User | null;
    places: Place[];
    userProfilesCache: { [key: string]: User };
    checkIns: CheckIn[];
    matches: Match[];
    favorites: Favorite[];
    goingIntentions: GoingIntention[];
    swipes: { swiped_id: string }[];
    livePostsByPlace: { [key: string]: LivePost[] };
    activeLivePosts: { place_id: string }[];
    promotions: Promotion[];
    ownerPromotions: (Promotion & { claim_count: number; redeemed_count: number })[] | any[];
    promotionClaims: PromotionClaim[];
    allFeedPosts: FeedPost[];
    isLoading: boolean;
    isAuthResolved: boolean;
    error: string | null;
    logout: () => void;
    completeOnboarding: () => void;
    checkInUser: (placeId: string) => Promise<void>;
    checkOutUser: () => void;
    getCurrentCheckIn: () => CheckIn | undefined;
    getPlaceById: (id: string) => Place | undefined;
    getUserById: (id: string) => User | undefined;
    sendMessage: (matchId: string, text: string) => Promise<void>;
    updateUserProfile: (updatedUser: Partial<User>) => Promise<void>;
    updateCurrentUserState: (updatedFields: Partial<User>) => void;
    addGoingIntention: (placeId: string) => Promise<void>;
    removeGoingIntention: (placeId: string) => Promise<void>;
    getCurrentGoingIntention: () => GoingIntention | undefined;
    isUserGoingToPlace: (placeId: string) => boolean;
    fetchPlaces: (city: string, state: string, query?: string) => Promise<Place[]>;
    searchPlaces: (city: string, state: string, query: string) => Promise<Place[]>;
    newlyFormedMatch: Match | null;
    clearNewMatch: () => void;
    addFavorite: (placeId: string) => Promise<void>;
    removeFavorite: (placeId: string) => Promise<void>;
    isFavorite: (placeId: string) => boolean;
    hasNewNotification: boolean;
    clearChatNotifications: () => void;
    fetchLivePostsForPlace: (placeId: string) => Promise<void>;
    createLivePost: (placeId: string, content: string) => Promise<void>;
    updateLivePost: (postId: string, newContent: string) => Promise<void>;
    deleteLivePost: (postId: string, placeId: string) => Promise<void>;
    getLivePostCount: (placeId: string) => number;
    getActivePromotionsForPlace: (placeId: string, type?: PromotionType) => Promotion[];
    claimPromotion: (promotionId: string) => Promise<ClaimResult | undefined>;
    createOwnerFeedPost: (payload: CreatePostPayload) => Promise<void>;
    ownerFeedPosts: FeedPost[];
    ownedPlaceIds: string[];
    activeOwnedPlaceId: string | null;
    setActiveOwnedPlaceId: (id: string | null) => void;
    addOwnedPlace: (place: Place) => Promise<void>;
    removeOwnedPlace: (placeId: string) => Promise<void>;
    verifyQrCode: (qrCodeValue: string) => Promise<any>;
    createPromotion: (payload: CreatePromotionPayload) => Promise<void>;
    updatePromotion: (promotionId: string, payload: Partial<CreatePromotionPayload>) => Promise<void>;
    deletePromotion: (promotionId: string) => Promise<void>;
    deleteAllLivePosts: () => Promise<void>;
    deleteAllOwnerFeedPosts: () => Promise<void>;
    likePost: (postId: string) => Promise<void>;
    unlikePost: (postId: string) => Promise<void>;
    addCommentToPost: (postId: string, content: string) => Promise<void>;
    getUserOrderForPlace: (placeId: string, type: 'check-in' | 'going') => number;
    fetchUsersForPlace: (placeId: string) => Promise<void>;
    potentialMatches: User[];
    fetchPotentialMatches: (placeId: string) => Promise<void>;
    getActiveTableForUser: (placeId: string) => Promise<number | null>;
    
    hasActiveOrders: boolean;
    fetchActiveOrdersStatus: () => Promise<void>;
    activeOrderPlaceId: string | null;
    activeTableNumber: number | null;

    reportVibe: (placeId: string, vibeType: string) => Promise<void>;
    getVibesForPlace: (placeId: string) => Promise<{ [key: string]: number }>;
    placesVibes: { [placeId: string]: { [vibe: string]: number } };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfilesCache, setUserProfilesCache] = useState<{ [key: string]: User }>({});
    const cacheRef = useRef<{ [key: string]: User }>({});
    
    const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => localStorage.getItem('onboarded') === 'true');
    const [places, setPlaces] = useState<Place[]>([]);
    const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [goingIntentions, setGoingIntentions] = useState<GoingIntention[]>([]);
    const [swipes, setSwipes] = useState<{ swiped_id: string }[]>([]);
    const [livePostsByPlace, setLivePostsByPlace] = useState<{ [key: string]: LivePost[] }>({});
    const [activeLivePosts, setActiveLivePosts] = useState<{ place_id: string }[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [ownerPromotions, setOwnerPromotions] = useState<(Promotion & { claim_count: number; redeemed_count: number })[]>([]);
    const [promotionClaims, setPromotionClaims] = useState<PromotionClaim[]>([]);
    const [ownerFeedPosts, setOwnerFeedPosts] = useState<FeedPost[]>([]);
    const [allFeedPosts, setAllFeedPosts] = useState<FeedPost[]>([]);
    const [ownedPlaceIds, setOwnedPlaceIds] = useState<string[]>([]);
    const [activeOwnedPlaceId, setActiveOwnedPlaceId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAuthResolved, setIsAuthResolved] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [newlyFormedMatch, setNewlyFormedMatch] = useState<Match | null>(null);
    const [hasNewNotification, setHasNewNotification] = useState<boolean>(false);
    const [potentialMatches, setPotentialMatches] = useState<User[]>([]);
    const [placesVibes, setPlacesVibes] = useState<{ [placeId: string]: { [vibe: string]: number } }>({});
    
    const [hasActiveOrders, setHasActiveOrders] = useState(false);
    const [activeOrderPlaceId, setActiveOrderPlaceId] = useState<string | null>(null);
    const [activeTableNumber, setActiveTableNumber] = useState<number | null>(null);

    const isAuthenticated = !!session?.user;

    useEffect(() => {
        cacheRef.current = userProfilesCache;
    }, [userProfilesCache]);

    const getUserById = useCallback((id: string) => cacheRef.current[id], []);

    const fetchProfilesByIds = useCallback(async (userIds: string[]) => {
        const idsToFetch = userIds.filter(id => !cacheRef.current[id]);
        if (idsToFetch.length === 0) return;

        const { data, error } = await supabase.from('profiles').select('*').in('id', idsToFetch);
        if (error) {
            console.error("Error fetching user profiles:", error);
            return;
        }
        const newProfiles: { [key: string]: User } = {};
        data.forEach(profile => {
            newProfiles[profile.id] = mapProfileToUser(profile, null);
        });
        setUserProfilesCache(prev => ({ ...prev, ...newProfiles }));
    }, []);

    const refreshActiveLivePosts = useCallback(async () => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('live_posts')
            .select('place_id')
            .gt('created_at', oneHourAgo);
        
        if (error) {
            console.error("Error refreshing active live posts:", error);
        } else {
            setActiveLivePosts(data || []);
        }
    }, []);

    const fetchAllVibes = useCallback(async (placeIds: string[]) => {
        if (placeIds.length === 0) return;
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('vibe_reports')
            .select('place_id, vibe_type')
            .in('place_id', placeIds)
            .gt('created_at', twoHoursAgo);

        if (!error && data) {
            const vibesMap: { [placeId: string]: { [vibe: string]: number } } = {};
            data.forEach(r => {
                vibesMap[r.place_id] = vibesMap[r.place_id] || {};
                vibesMap[r.place_id][r.vibe_type] = (vibesMap[r.place_id][r.vibe_type] || 0) + 1;
            });
            setPlacesVibes(vibesMap);
        }
    }, []);
    
    const refreshOwnerPromotions = useCallback(async (userId: string) => {
        if (!userId) return;
        const { data, error } = await supabase.rpc('get_owner_promotions_with_counts', {
            user_id_param: userId,
        });
        if (error) {
            console.error("Error fetching owner promotions with counts:", error);
        } else {
            const mappedPromos = data.map((p: any) => ({
                ...mapPromotion(p),
                claim_count: p.claim_count || 0,
                redeemed_count: p.redeemed_count || 0,
            }));
            setOwnerPromotions(mappedPromos);
        }
    }, []);

    const mergePlaces = useCallback((newPlaces: Place[]) => {
        setPlaces(prevPlaces => {
            const existingIds = new Set(prevPlaces.map(p => p.id));
            const uniqueNewPlaces = newPlaces.filter(p => !existingIds.has(p.id));
            const result = [...prevPlaces, ...uniqueNewPlaces];
            fetchAllVibes(result.map(p => p.id));
            return result;
        });
    }, [fetchAllVibes]);

    const fetchPlaces = useCallback(async (city: string, state: string, query?: string): Promise<Place[]> => {
        if (!city || !state) return [];
        setError(null);
        try {
            const { data, error } = await supabase.functions.invoke('get-places-by-city', {
                body: { city, state, query },
            });
            if (error) throw error;
            if (Array.isArray(data)) {
                mergePlaces(data);
                return data;
            }
            throw new Error("Dados de locais inválidos.");
        } catch (e: any) {
            setError("Não foi possível carregar os locais.");
            return [];
        }
    }, [mergePlaces]);

    const searchPlaces = useCallback(async (city: string, state: string, query: string): Promise<Place[]> => {
        return fetchPlaces(city, state, query);
    }, [fetchPlaces]);

    const fetchOwnerFeedPosts = useCallback(async (userId: string) => {
        const { data: postsData, error: postsError } = await supabase
            .from('feed_posts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (postsError) throw postsError;
        if (postsData.length === 0) {
            setOwnerFeedPosts([]);
            return;
        }

        const postIds = postsData.map(p => p.id);

        const { data: likesData, error: likesError } = await supabase
            .from('post_likes')
            .select('*')
            .in('post_id', postIds);
        if (likesError) throw likesError;

        const { data: commentsData, error: commentsError } = await supabase
            .from('post_comments')
            .select('*, profiles(name)')
            .in('post_id', postIds)
            .order('created_at', { ascending: true });
        if (commentsError) throw commentsError;

        const likesByPostId = likesData.reduce((acc, like) => {
            acc[like.post_id] = acc[like.post_id] || [];
            acc[like.post_id].push(like);
            return acc;
        }, {} as { [key: string]: any[] });

        const commentsByPostId = commentsData.reduce((acc, comment) => {
            acc[comment.post_id] = acc[comment.post_id] || [];
            acc[comment.post_id].push(mapPostComment(comment));
            return acc;
        }, {} as { [key: string]: PostComment[] });

        const mappedPosts: FeedPost[] = postsData.map((p: any) => {
            const postId = p.id;
            const likes = likesByPostId[postId] || [];
            const comments = commentsByPostId[postId] || [];

            return {
                id: postId,
                placeId: p.place_id,
                placeName: p.place_name,
                placeLogoUrl: p.place_logo_url || '',
                type: p.type,
                mediaUrl: p.media_url,
                caption: p.caption,
                likes: likes.length,
                comments: comments,
                timestamp: new Date(p.created_at).toISOString(),
                isLikedByCurrentUser: likes.some(l => l.user_id === userId),
            };
        });
        setOwnerFeedPosts(mappedPosts);
    }, []);
    
    const getActiveTableForUser = useCallback(async (placeId: string): Promise<number | null> => {
        if (!currentUser) return null;
        const { data, error } = await supabase
            .from('tables')
            .select('table_number')
            .eq('place_id', placeId)
            .eq('current_user_id', currentUser.id)
            .maybeSingle();
        
        if (error || !data) return null;
        return data.table_number;
    }, [currentUser]);

    const fetchActiveOrdersStatus = useCallback(async () => {
        if (!currentUser?.id) {
            setHasActiveOrders(false);
            setActiveOrderPlaceId(null);
            setActiveTableNumber(null);
            return;
        }

        const { data: tableData, error: tableError } = await supabase
            .from('tables')
            .select('place_id, table_number')
            .eq('current_user_id', currentUser.id)
            .limit(1);
            
        if (tableError) {
            console.error("Error fetching active table status:", tableError);
        }

        if (tableData && tableData.length > 0) {
            setHasActiveOrders(true);
            setActiveOrderPlaceId(tableData[0].place_id);
            setActiveTableNumber(tableData[0].table_number);
            return;
        }

        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('place_id, table_number')
            .eq('user_id', currentUser.id)
            .not('status', 'in', '("paid", "cancelled")')
            .limit(1);

        if (ordersError) {
            console.error("Error fetching active orders status:", ordersError);
            setHasActiveOrders(false);
            setActiveOrderPlaceId(null);
            setActiveTableNumber(null);
            return;
        }

        if (ordersData && ordersData.length > 0) {
            setHasActiveOrders(true);
            setActiveOrderPlaceId(ordersData[0].place_id);
            setActiveTableNumber(ordersData[0].table_number);
            return;
        }
        
        setHasActiveOrders(false);
        setActiveOrderPlaceId(null);
        setActiveTableNumber(null);

    }, [currentUser]);

    const reportVibe = async (placeId: string, vibeType: string) => {
        if (!currentUser) return;
        const { error } = await supabase.from('vibe_reports').insert({
            user_id: currentUser.id,
            place_id: placeId,
            vibe_type: vibeType
        });
        if (error) {
            if (error.message.includes('check_ins')) {
                toast.error("Você precisa ter feito check-in para reportar a vibe!");
            } else {
                toast.error("Erro ao enviar reporte.");
            }
        } else {
            toast.success("Vibe enviada!");
            fetchAllVibes([placeId]);
        }
    };

    const getVibesForPlace = async (placeId: string) => {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('vibe_reports')
            .select('vibe_type')
            .eq('place_id', placeId)
            .gt('created_at', twoHoursAgo);

        if (error) return {};
        
        const vibes = (data || []).reduce((acc: any, curr: any) => {
            acc[curr.vibe_type] = (acc[curr.vibe_type] || 0) + 1;
            return acc;
        }, {});
        
        setPlacesVibes(prev => ({ ...prev, [placeId]: vibes }));
        return vibes;
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsAuthResolved(true);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!session?.user) {
            setCurrentUser(null);
            setIsLoading(false);
            return;
        }

        const fetchInitialData = async () => {
            try {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profileError) throw profileError;
                
                const mappedUser = mapProfileToUser(profileData, session.user);
                setCurrentUser(mappedUser);
                setUserProfilesCache(prev => ({ ...prev, [mappedUser.id]: mappedUser }));

                const localPlaces = await fetchPlaces(mappedUser.city || '', mappedUser.state || '');
                const localPlaceIds = localPlaces.map(p => p.id);
                
                if (localPlaceIds.length > 0) fetchAllVibes(localPlaceIds);

                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

                const [
                    checkInsRes,
                    goingRes,
                    favoritesRes,
                    swipesRes,
                    promotionsRes,
                    claimsRes,
                    ownedPlacesRes,
                    allPostsRes,
                    matchesRes
                ] = await Promise.all([
                    supabase.from('check_ins').select('*').in('place_id', localPlaceIds),
                    supabase.from('going_intentions').select('*').in('place_id', localPlaceIds),
                    supabase.from('favorites').select('*').eq('user_id', session.user.id),
                    supabase.from('swipes').select('swiped_id').eq('swiper_id', session.user.id),
                    supabase.from('promotions').select('*').gte('end_date', new Date().toISOString()),
                    supabase.from('promotion_claims').select('*, promotions(*)').eq('user_id', session.user.id),
                    mappedUser.role === 'owner' ? supabase.from('place_owners').select('place_id').eq('user_id', session.user.id) : Promise.resolve({ data: [], error: null }),
                    supabase.from('feed_posts').select('*').gt('created_at', oneHourAgo).order('created_at', { ascending: false }),
                    supabase.from('matches').select('*').or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
                ]);

                if (checkInsRes.error) throw checkInsRes.error;
                setCheckIns(checkInsRes.data.map(c => ({ userId: c.user_id, placeId: c.place_id, timestamp: new Date(c.created_at).getTime(), createdAt: c.created_at })));

                if (goingRes.error) throw goingRes.error;
                setGoingIntentions(goingRes.data.map(g => ({ userId: g.user_id, placeId: g.place_id, timestamp: new Date(g.created_at).getTime(), createdAt: g.created_at })));

                if (favoritesRes.error) throw favoritesRes.error;
                setFavorites(favoritesRes.data.map(f => ({ id: f.id, userId: f.user_id, placeId: f.place_id })));

                if (swipesRes.error) throw swipesRes.error;
                setSwipes(swipesRes.data);

                if (promotionsRes.error) throw promotionsRes.error;
                setPromotions(promotionsRes.data.map(mapPromotion));

                if (claimsRes.error) throw claimsRes.error;
                setPromotionClaims(claimsRes.data.map(mapClaim));

                if (ownedPlacesRes.error) throw ownedPlacesRes.error;
                const ownerIds = ownedPlacesRes.data?.map(p => p.place_id) || [];
                setOwnedPlaceIds(ownerIds);
                
                // Define o local ativo inicial se for lojista
                if (ownerIds.length > 0) {
                    setActiveOwnedPlaceId(ownerIds[0]);
                }

                if (allPostsRes.error) throw allPostsRes.error;
                const allPostsData = allPostsRes.data;

                if (allPostsData.length > 0) {
                    const postIds = allPostsData.map(p => p.id);
                    const { data: likesData } = await supabase.from('post_likes').select('*').in('post_id', postIds);
                    const { data: commentsData } = await supabase.from('post_comments').select('*, profiles(name)').in('post_id', postIds).order('created_at', { ascending: true });

                    const likesByPostId = (likesData || []).reduce((acc, like) => { (acc[like.post_id] = acc[like.post_id] || []).push(like); return acc; }, {} as { [key: string]: any[] });
                    const commentsByPostId = (commentsData || []).reduce((acc, comment) => { (acc[comment.post_id] = acc[comment.post_id] || []).push(mapPostComment(comment)); return acc; }, {} as { [key: string]: PostComment[] });

                    const mappedAllPosts: FeedPost[] = allPostsData.map((p: any) => {
                        const likes = likesByPostId[p.id] || [];
                        return {
                            id: p.id, placeId: p.place_id, placeName: p.place_name, placeLogoUrl: p.place_logo_url || '', type: p.type,
                            mediaUrl: p.media_url, caption: p.caption, likes: likes.length, comments: commentsByPostId[p.id] || [],
                            timestamp: new Date(p.created_at).toISOString(), isLikedByCurrentUser: likes.some(l => l.user_id === session.user.id),
                        };
                    });
                    setAllFeedPosts(mappedAllPosts);
                } else {
                    setAllFeedPosts([]);
                }
                
                if (matchesRes.error) throw matchesRes.error;
                const otherUserIds = matchesRes.data.map(m => m.user1_id === session.user.id ? m.user2_id : m.user1_id);
                await fetchProfilesByIds(otherUserIds);
                
                const mappedMatches: Match[] = matchesRes.data.map((m: any) => {
                    const otherUserId = m.user1_id === session.user.id ? m.user2_id : m.user1_id;
                    return {
                        id: m.id,
                        userIds: [m.user1_id, m.user2_id],
                        createdAt: m.created_at,
                        otherUser: cacheRef.current[otherUserId],
                        lastMessage: 'Novo Match!',
                    };
                });
                setMatches(mappedMatches);

                const requiredPlaceIds = new Set([
                    ...favoritesRes.data.map(f => f.place_id),
                    ...claimsRes.data.map(c => c.promotion_id ? c.promotions.place_id : null).filter(Boolean),
                    ...ownerIds
                ]);
                
                const currentPlacesIds = new Set(localPlaces.map(p => p.id));
                const missingPlaceIds = [...requiredPlaceIds].filter(id => id && !currentPlacesIds.has(id as string));

                if (missingPlaceIds.length > 0) {
                    const { data: missingPlacesData } = await supabase.functions.invoke('get-places-by-ids', {
                        body: { placeIds: missingPlaceIds },
                    });
                    if (Array.isArray(missingPlacesData)) mergePlaces(missingPlacesData);
                }

                if (mappedUser.role === 'owner') {
                    await fetchOwnerFeedPosts(session.user.id);
                    await refreshOwnerPromotions(session.user.id);
                }
                
                await fetchActiveOrdersStatus();
                await refreshActiveLivePosts();

            } catch (e: any) {
                console.error("Initial data fetch error:", e);
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [session?.user?.id]);

    useEffect(() => {
        if (!isAuthenticated || !currentUser?.id) return;
        
        const intervalId = setInterval(refreshActiveLivePosts, 60000);
        const orderStatusIntervalId = setInterval(fetchActiveOrdersStatus, 10000);
        const vibeIntervalId = setInterval(() => fetchAllVibes(places.map(p => p.id)), 30000);
        
        // Listener de pedidos do usuário (Notificações de Status)
        const ordersChannel = supabase.channel(`user-orders-${currentUser.id}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'orders', 
                filter: `user_id=eq.${currentUser.id}` 
            }, (payload) => {
                const updatedOrder = payload.new as any;
                const oldOrder = payload.old as any;
                
                if (updatedOrder.status !== oldOrder.status) {
                    fetchActiveOrdersStatus();
                    
                    const statusMessages: { [key: string]: string } = {
                        'preparing': '🍔 Seu pedido começou a ser preparado!',
                        'delivering': '🚀 Seu pedido está a caminho da mesa!',
                        'delivered': '✅ Seu pedido foi entregue. Bom apetite!',
                        'paid': '💳 Conta finalizada com sucesso. Obrigado!',
                    };
                    
                    if (statusMessages[updatedOrder.status]) {
                        toast.success(statusMessages[updatedOrder.status], { duration: 5000, icon: '🍽️' });
                    }
                }
            }).subscribe();

        const messagesChannel = supabase.channel(`user-messages-${currentUser.id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages'
            }, (payload) => {
                const newMessage = payload.new as any;
                const currentPath = window.location.hash; 

                if (newMessage.sender_id !== currentUser.id && !currentPath.includes(`/chat/${newMessage.match_id}`)) {
                    setHasNewNotification(true);
                    toast('Nova mensagem recebida!', { icon: '💬', position: 'bottom-center' });
                }
            }).subscribe();

        const livePostsChannel = supabase.channel('live-posts-feed').on<LivePost>('postgres_changes', { event: '*', schema: 'public', table: 'live_posts' }, async (payload) => {
            if (payload.eventType === 'INSERT') {
                const newPost = payload.new as any;
                await refreshActiveLivePosts();
                const { data: profileData } = await supabase.from('profiles').select('id, name, photos, role').eq('id', newPost.user_id).single();
                if (profileData) {
                    newPost.profiles = profileData;
                    setLivePostsByPlace(prev => ({ ...prev, [newPost.place_id]: [newPost, ...(prev[newPost.place_id] || [])] }));
                }
            } else if (payload.eventType === 'UPDATE') {
                const updatedPost = payload.new as any;
                setLivePostsByPlace(prev => {
                    const posts = prev[updatedPost.place_id] || [];
                    const postIndex = posts.findIndex(p => p.id === updatedPost.id);
                    if (postIndex > -1) {
                        posts[postIndex].content = updatedPost.content;
                    }
                    return { ...prev };
                });
            } else if (payload.eventType === 'DELETE') {
                const deletedPost = payload.old as any;
                setLivePostsByPlace(prev => {
                    const posts = prev[deletedPost.place_id] || [];
                    const filteredPosts = posts.filter(p => p.id !== deletedPost.id);
                    return { ...prev, [deletedPost.place_id]: filteredPosts };
                });
            }
        }).subscribe();
        
        const claimsChannel = supabase.channel('promotion-claims-listener').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'promotion_claims' }, () => {
            if (currentUser?.role === 'owner' && currentUser.id) {
                refreshOwnerPromotions(currentUser.id);
            }
        }).subscribe();

        const matchesChannel = supabase.channel('matches-listener').on<Match>(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'matches' },
            async (payload) => {
                const newMatchData = payload.new as any;
                const currentUserId = currentUser?.id;

                if (currentUserId && (newMatchData.user1_id === currentUserId || newMatchData.user2_id === currentUserId)) {
                    const otherUserId = newMatchData.user1_id === currentUserId ? newMatchData.user2_id : newMatchData.user1_id;
                    
                    await fetchProfilesByIds([otherUserId]);
                    
                    const newMatch: Match = {
                        id: newMatchData.id,
                        userIds: [newMatchData.user1_id, newMatchData.user2_id],
                        createdAt: newMatchData.created_at,
                        otherUser: cacheRef.current[otherUserId],
                        lastMessage: 'Novo Match!',
                    };
                    
                    setMatches(prev => [...prev, newMatch]);
                    setNewlyFormedMatch(newMatch);
                    setHasNewNotification(true);
                }
            }
        ).subscribe();


        return () => {
            clearInterval(intervalId);
            clearInterval(orderStatusIntervalId);
            clearInterval(vibeIntervalId);
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(messagesChannel);
            supabase.removeChannel(livePostsChannel);
            supabase.removeChannel(claimsChannel);
            supabase.removeChannel(matchesChannel);
        };
    }, [isAuthenticated, currentUser?.id, currentUser?.role, refreshActiveLivePosts, refreshOwnerPromotions, fetchProfilesByIds, fetchActiveOrdersStatus, places, fetchAllVibes]);

    const completeOnboarding = () => {
        localStorage.setItem('onboarded', 'true');
        setHasOnboarded(true);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setSession(null);
    };
    
    const fetchLivePostsForPlace = useCallback(async (placeId: string) => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('live_posts')
            .select('*, profiles(id, name, photos, role)')
            .eq('place_id', placeId)
            .gt('created_at', oneHourAgo)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            console.error(`Error fetching live posts for ${placeId}:`, error);
        } else {
            const mappedData: LivePost[] = (data || []).map((item: any) => ({
                id: item.id,
                user_id: item.user_id,
                place_id: item.place_id,
                content: item.content,
                created_at: item.created_at,
                profiles: item.profiles,
            }));
            setLivePostsByPlace(prev => ({ ...prev, [placeId]: mappedData }));
        }
    }, []);

    const createLivePost = async (placeId: string, content: string) => {
        const { error } = await supabase.functions.invoke('create-live-post', {
            body: { placeId, content },
        });
        if (error) {
            const errorData = JSON.parse(error.context?.response?.text || '{}');
            throw new Error(errorData.error || 'Falha ao criar o post.');
        }
    };

    const updateLivePost = async (postId: string, newContent: string) => {
        const { error } = await supabase.functions.invoke('update-live-post', {
            body: { postId, content: newContent },
        });
        if (error) {
            const errorData = JSON.parse(error.context?.response?.text || '{}');
            throw new Error(errorData.error || 'Falha ao atualizar o post.');
        }
    };

    const deleteLivePost = async (postId: string, placeId: string) => {
        const originalPosts = livePostsByPlace[placeId] || [];
        const updatedPosts = originalPosts.filter(p => p.id !== postId);
        setLivePostsByPlace(prev => ({ ...prev, [placeId]: updatedPosts }));
    
        try {
            const { error } = await supabase.functions.invoke('delete-live-post', { body: { postId } });
            if (error) {
                setLivePostsByPlace(prev => ({ ...prev, [placeId]: originalPosts }));
                const errorData = JSON.parse(error.context?.response?.text || '{}');
                throw new Error(errorData.error || 'Falha ao apagar o post.');
            }
        } catch (e) {
            setLivePostsByPlace(prev => ({ ...prev, [placeId]: originalPosts }));
            throw e;
        }
    };

    const deleteAllLivePosts = async () => {
        const { error } = await supabase.functions.invoke('delete-all-live-posts', { method: 'POST' });
        if (error) {
            const errorData = JSON.parse(error.context?.response?.text || '{}');
            throw new Error(errorData.error || 'Falha ao excluir todos os posts ao vivo.');
        }
        setLivePostsByPlace({});
        setActiveLivePosts([]);
    };
    
    const deleteAllOwnerFeedPosts = async () => {
        if (!currentUser || currentUser.role !== 'owner') throw new Error("Apenas lojistas podem excluir posts.");
        const { error: deleteError } = await supabase.from('feed_posts').delete().eq('user_id', currentUser.id);
        if (deleteError) throw new Error(`Falha ao excluir posts: ${deleteError.message}`);
        setOwnerFeedPosts([]);
    };

    const claimPromotion = useCallback(async (promotionId: string): Promise<ClaimResult | undefined> => {
        if (!currentUser) return;
        try {
            const { data, error } = await supabase.functions.invoke('claim-promotion', { method: 'POST', body: { promotionId } });
            if (error) {
                const errorData = JSON.parse(error.context?.response?.text || '{}');
                throw new Error(errorData.error || 'Falha ao reivindicar a promoção.');
            }
            if (data.claimed && !promotionClaims.some(c => c.promotionId === promotionId)) {
                const { data: newClaimData } = await supabase.from('promotion_claims').select('*, promotions(*)').eq('promotion_id', promotionId).eq('user_id', currentUser.id).single();
                if (newClaimData) setPromotionClaims(prev => [...prev, mapClaim(newClaimData)]);
            }
            if (currentUser.role === 'owner') refreshOwnerPromotions(currentUser.id);
            return { success: data.success, message: data.message, isWinner: data.isWinner, claimOrder: data.claimOrder, claimId: data.claimId };
        } catch (e: any) {
            return { success: false, message: e.message, isWinner: false };
        }
    }, [currentUser, promotionClaims, refreshOwnerPromotions]);

    const getPlaceById = (id: string) => places.find(p => p.id === id);
    const getCurrentCheckIn = () => checkIns.find(ci => ci.userId === currentUser?.id);
    const getCurrentGoingIntention = () => goingIntentions.find(gi => gi.userId === currentUser?.id); 
    const isUserGoingToPlace = (placeId: string) => goingIntentions.some(gi => gi.userId === currentUser?.id && gi.placeId === placeId);
    const isFavorite = (placeId: string) => favorites.some(f => f.placeId === placeId);
    const clearNewMatch = () => setNewlyFormedMatch(null);
    const clearChatNotifications = () => setHasNewNotification(false);
    const getLivePostCount = (placeId: string) => activeLivePosts.filter(p => p.place_id === placeId).length;
    
    const getActivePromotionsForPlace = (placeId: string, type?: PromotionType) => {
        const now = new Date();
        return promotions.filter(p => 
            p.placeId === placeId && 
            new Date(p.startDate) <= now && 
            new Date(p.endDate) >= now &&
            (!type || p.promotionType === type)
        );
    };
    
    const getUserOrderForPlace = useCallback((placeId: string, type: 'check-in' | 'going'): number => {
        if (!currentUser) return 0;
        const records = type === 'check-in' ? checkIns : goingIntentions;
        const userRecord = records.find(r => r.userId === currentUser.id && r.placeId === placeId);
        if (!userRecord) return 0;
        return records.filter(r => r.placeId === placeId && r.createdAt <= userRecord.createdAt).length;
    }, [currentUser, checkIns, goingIntentions]);


    const checkInUser = async (placeId: string) => {
        if (!currentUser) return;
        
        // 1. Remove check-in e intenções existentes
        await supabase.from('check_ins').delete().eq('user_id', currentUser.id);
        await supabase.from('going_intentions').delete().eq('user_id', currentUser.id);
        
        // 2. Insere novo check-in
        const { data, error } = await supabase.from('check_ins').insert({ user_id: currentUser.id, place_id: placeId }).select().single();
        
        if (error) {
            const { data: currentData } = await supabase.from('check_ins').select('*').in('place_id', places.map(p => p.id));
            if (currentData) setCheckIns(currentData.map(c => ({ userId: c.user_id, placeId: c.place_id, timestamp: new Date(c.created_at).getTime(), createdAt: c.created_at })));
            throw error;
        }
        
        // 3. Atualiza estado local
        if (data) {
            setCheckIns(prev => [...prev.filter(ci => ci.userId !== currentUser.id), { userId: data.user_id, placeId: data.place_id, timestamp: Date.now(), createdAt: data.created_at }]);
            setGoingIntentions(prev => prev.filter(gi => gi.userId !== currentUser.id));
        }
    };

    const checkOutUser = async () => {
        if (!currentUser) return;
        
        try {
            await supabase
                .from('tables')
                .update({ current_user_id: null })
                .eq('current_user_id', currentUser.id);
        } catch (e) {
            console.error("Erro ao liberar mesa no checkout:", e);
        }

        setCheckIns(prev => prev.filter(ci => ci.userId !== currentUser.id));
        await supabase.from('check_ins').delete().eq('user_id', currentUser.id);
        
        fetchActiveOrdersStatus();
    };

    const addGoingIntention = async (placeId: string) => {
        if (!currentUser) return;
        const currentIntentions = goingIntentions.filter(gi => gi.userId === currentUser.id);
        if (currentIntentions.length >= 3) throw new Error("Máximo de 3 locais.");
        if (currentIntentions.some(gi => gi.placeId === placeId)) return;
        
        setGoingIntentions(prev => [...prev, { userId: currentUser.id, placeId, timestamp: Date.now(), createdAt: new Date().toISOString() }]);
        
        const { data, error } = await supabase.from('going_intentions').insert({ user_id: currentUser.id, place_id: placeId }).select().single();
        if (error) {
            setGoingIntentions(prev => prev.filter(gi => !(gi.userId === currentUser.id && gi.placeId === placeId)));
            throw error;
        }
        if (data) {
            setGoingIntentions(prev => [...prev.filter(gi => !(gi.userId === currentUser.id && gi.placeId === placeId)), { userId: data.user_id, placeId: data.place_id, timestamp: Date.now(), createdAt: data.created_at }]);
        }
    };

    const removeGoingIntention = async (placeId: string) => {
        if (!currentUser) return;
        setGoingIntentions(prev => prev.filter(gi => !(gi.userId === currentUser.id && gi.placeId === placeId)));
        await supabase.from('going_intentions').delete().eq('user_id', currentUser.id).eq('place_id', placeId);
    };

    const sendMessage = async (matchId: string, content: string) => {
        if (!currentUser) return;
        await supabase.from('messages').insert({ match_id: matchId, sender_id: currentUser.id, content });
    };

    const updateUserProfile = async (updatedUser: Partial<User>) => {
        if (!currentUser || !session?.user) return;
        const dbPayload: { [key: string]: any } = {};
        if (updatedUser.name !== undefined) dbPayload.name = updatedUser.name;
        if (updatedUser.age !== undefined) dbPayload.age = updatedUser.age;
        if (updatedUser.bio !== undefined) dbPayload.bio = updatedUser.bio;
        if (updatedUser.interests !== undefined) dbPayload.interests = updatedUser.interests;
        if (updatedUser.photos !== undefined) dbPayload.photos = updatedUser.photos;
        if (updatedUser.gender !== undefined) dbPayload.gender = updatedUser.gender;
        if (updatedUser.sexualOrientation !== undefined) dbPayload.sexual_orientation = updatedUser.sexualOrientation;
        if (updatedUser.matchPreferences !== undefined) dbPayload.match_preferences = updatedUser.matchPreferences;
        if (updatedUser.city !== undefined) dbPayload.city = updatedUser.city;
        if (updatedUser.state !== undefined) dbPayload.state = updatedUser.state;
        if (updatedUser.isAvailableForMatch !== undefined) dbPayload.is_available_for_match = updatedUser.isAvailableForMatch;

        const { data, error } = await supabase.from('profiles').update(dbPayload).eq('id', currentUser.id).select().single();
        if (error) throw new Error(`Falha ao atualizar o perfil: ${error.message}`);
        if (data) setCurrentUser(mapProfileToUser(data, session.user));
    };

    const updateCurrentUserState = (updatedFields: Partial<User>) => {
        if (currentUser) setCurrentUser(prevUser => prevUser ? { ...prevUser, ...updatedFields } : null);
    };

    const addFavorite = async (placeId: string) => {
        if (!currentUser || isFavorite(placeId)) return;
        const { data, error } = await supabase.from('favorites').insert({ user_id: currentUser.id, place_id: placeId }).select().single();
        if (!error && data) setFavorites(prev => [...prev, { id: data.id, userId: data.user_id, placeId: data.place_id }]);
    };

    const removeFavorite = async (placeId: string) => {
        if (!currentUser) return;
        const favorite = favorites.find(f => f.placeId === placeId);
        if (!favorite) return;
        const { error } = await supabase.from('favorites').delete().eq('id', favorite.id);
        if (!error) setFavorites(prev => prev.filter(f => f.placeId !== placeId));
    };

    const createOwnerFeedPost = async (payload: CreatePostPayload) => {
        if (!currentUser || currentUser.role !== 'owner') throw new Error("Apenas lojistas podem postar.");
        const placeDetails = getPlaceById(payload.placeId);
        const { error } = await supabase.from('feed_posts').insert({
            user_id: currentUser.id, place_id: payload.placeId, place_name: placeDetails?.name || payload.placeId,
            place_logo_url: placeDetails?.photoUrl || null, type: payload.type, media_url: payload.mediaUrl, caption: payload.caption,
        });
        if (error) throw error;
        await fetchOwnerFeedPosts(currentUser.id);
    };

    const addOwnedPlace = async (place: Place) => {
        if (!currentUser || ownedPlaceIds.includes(place.id)) return;
        const { error } = await supabase.from('place_owners').insert({ user_id: currentUser.id, place_id: place.id });
        if (error) throw error;
        setOwnedPlaceIds(prev => [...prev, place.id]);
        
        // Se for o primeiro local, define como ativo
        if (ownedPlaceIds.length === 0) {
            setActiveOwnedPlaceId(place.id);
        }
        
        mergePlaces([place]);
    };

    const removeOwnedPlace = async (placeId: string) => {
        if (!currentUser) return;
        const { error } = await supabase.from('place_owners').delete().eq('user_id', currentUser.id).eq('place_id', placeId);
        if (error) throw error;
        
        const remaining = ownedPlaceIds.filter(id => id !== placeId);
        setOwnedPlaceIds(remaining);
        
        if (activeOwnedPlaceId === placeId) {
            setActiveOwnedPlaceId(remaining.length > 0 ? remaining[0] : null);
        }
    };

    const verifyQrCode = async (qrCodeValue: string) => {
        const { data, error } = await supabase.functions.invoke('verify-qrcode', { body: { qrCodeValue } });
        if (error) throw error;
        return data;
    };

    const createPromotion = async (payload: CreatePromotionPayload) => {
        if (!currentUser) throw new Error("Usuário não autenticado.");
        const { error } = await supabase.from('promotions').insert({
            title: payload.title, description: payload.description, place_id: payload.placeId, place_name: payload.placeName,
            place_photo_url: payload.placePhotoUrl, promotion_type: payload.promotionType, limit_count: payload.limitCount,
            start_date: payload.startDate, end_date: payload.endDate, created_by: currentUser.id,
        });
        if (error) throw error;
        await refreshOwnerPromotions(currentUser.id);
    };

    const updatePromotion = async (promotionId: string, payload: Partial<CreatePromotionPayload>) => {
        if (!currentUser) throw new Error("Usuário não autenticado.");
        const dbPayload: { [key: string]: any } = {};
        if (payload.title !== undefined) dbPayload.title = payload.title;
        if (payload.description !== undefined) dbPayload.description = payload.description;
        if (payload.limitCount !== undefined) dbPayload.limit_count = payload.limitCount;
        if (payload.endDate !== undefined) dbPayload.end_date = new Date(payload.endDate).toISOString();
        const { error } = await supabase.from('promotions').update(dbPayload).eq('id', promotionId).eq('created_by', currentUser.id);
        if (error) throw error;
        await refreshOwnerPromotions(currentUser.id);
    };

    const deletePromotion = async (promotionId: string) => {
        if (!currentUser) throw new Error("Usuário não autenticado.");
        await supabase.from('promotion_claims').delete().eq('promotion_id', promotionId);
        const { error = null } = await supabase.from('promotions').delete().eq('id', promotionId).eq('created_by', currentUser.id);
        if (error) throw error;
        setOwnerPromotions(prev => prev.filter(p => p.id !== promotionId));
    };
    
    const likePost = async (postId: string) => {
        if (!currentUser) return;
        const { error } = await supabase.from('post_likes').insert({ user_id: currentUser.id, post_id: postId });
        if (error) throw error;
        const updater = (p: FeedPost) => p.id === postId ? { ...p, likes: p.likes + 1, isLikedByCurrentUser: true } : p;
        setAllFeedPosts(prev => prev.map(updater));
        setOwnerFeedPosts(prev => prev.map(updater));
    };

    const unlikePost = async (postId: string) => {
        if (!currentUser) return;
        const { error } = await supabase.from('post_likes').delete().eq('user_id', currentUser.id).eq('post_id', postId);
        if (error) throw error;
        const updater = (p: FeedPost) => p.id === postId ? { ...p, likes: p.likes - 1, isLikedByCurrentUser: false } : p;
        setAllFeedPosts(prev => prev.map(updater));
        setOwnerFeedPosts(prev => prev.map(updater));
    };

    const addCommentToPost = async (postId: string, content: string) => {
        if (!currentUser) return;
        const { data, error } = await supabase.from('post_comments').insert({ user_id: currentUser.id, post_id: postId, content }).select().single();
        if (error) throw error;
        const newComment: PostComment = { id: data.id, userId: currentUser.id, postId, content: data.content, createdAt: data.created_at, profiles: { name: currentUser.name } };
        const updater = (p: FeedPost) => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p;
        setAllFeedPosts(prev => prev.map(updater));
        setOwnerFeedPosts(prev => prev.map(updater));
    };

    const fetchUsersForPlace = async (placeId: string) => {
        const { data: checkInsData } = await supabase.from('check_ins').select('user_id').eq('place_id', placeId);
        const { data: goingData } = await supabase.from('going_intentions').select('user_id').eq('place_id', placeId);
        const userIds = new Set([...(checkInsData || []).map(c => c.user_id), ...(goingData || []).map(g => g.user_id)]);
        await fetchProfilesByIds(Array.from(userIds));
    };

    const fetchPotentialMatches = useCallback(async (placeId: string) => {
        if (!session?.user) return;
        try {
            const { data, error } = await supabase.functions.invoke('get-potential-matches', { body: { placeId } });
            if (error) throw error;
            if (Array.isArray(data)) {
                const mappedUsers = data.map(profile => mapProfileToUser(profile, null));
                setPotentialMatches(mappedUsers);
                const newProfiles: { [key: string]: User } = {};
                mappedUsers.forEach(user => { newProfiles[user.id] = user; });
                setUserProfilesCache(prev => ({ ...prev, ...newProfiles }));
            }
        } catch (e: any) {
            console.error("Potential matches fetch error:", e);
        }
    }, [session]);

    const value = {
        isAuthenticated, hasOnboarded, currentUser, places, userProfilesCache, checkIns, matches, favorites,
        goingIntentions, swipes, livePostsByPlace, activeLivePosts, promotions, ownerPromotions, promotionClaims,
        allFeedPosts, isLoading, isAuthResolved, error, logout, completeOnboarding, checkInUser, checkOutUser, getCurrentCheckIn,
        getPlaceById, getUserById, sendMessage, updateUserProfile, updateCurrentUserState, addGoingIntention,
        removeGoingIntention, getCurrentGoingIntention, isUserGoingToPlace, fetchPlaces, searchPlaces,
        newlyFormedMatch, clearNewMatch, addFavorite, removeFavorite, isFavorite, hasNewNotification,
        clearChatNotifications, fetchLivePostsForPlace, createLivePost, updateLivePost, deleteLivePost, getLivePostCount, getActivePromotionsForPlace,
        claimPromotion, createOwnerFeedPost, ownerFeedPosts, ownedPlaceIds, activeOwnedPlaceId, setActiveOwnedPlaceId, addOwnedPlace, removeOwnedPlace,
        verifyQrCode, createPromotion, updatePromotion, deletePromotion, deleteAllLivePosts, deleteAllOwnerFeedPosts,
        likePost, unlikePost, addCommentToPost, getUserOrderForPlace, fetchUsersForPlace,
        potentialMatches, fetchPotentialMatches, getActiveTableForUser,
        hasActiveOrders, fetchActiveOrdersStatus, activeOrderPlaceId, activeTableNumber,
        reportVibe, getVibesForPlace, placesVibes
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};