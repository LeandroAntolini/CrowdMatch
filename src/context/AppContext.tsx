import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, Place, CheckIn, Match, Message, GoingIntention, Promotion, PromotionClaim, PromotionType, FeedPost, PostComment, PostLike } from '../types';
import { supabase } from '../integrations/supabase/client'; // Caminho atualizado
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { showSuccess, showError, showLoading, dismissToast, updateToast } from '../utils/toast'; // Importar toasts

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
    type: 'image' | 'video' | 'live-highlight'; // Adicionando 'live-highlight' para clareza
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

interface AppContextType {
    isAuthenticated: boolean;
    hasOnboarded: boolean;
    currentUser: User | null;
    places: Place[];
    users: User[];
    checkIns: CheckIn[];
    matches: Match[];
    favorites: Favorite[];
    goingIntentions: GoingIntention[];
    swipes: { swiped_id: string }[];
    livePostsByPlace: { [key: string]: LivePost[] };
    activeLivePosts: { place_id: string }[];
    promotions: Promotion[];
    ownerPromotions: (Promotion & { claim_count: number; redeemed_count: number })[]; // Tipagem ajustada para garantir que são números
    promotionClaims: PromotionClaim[];
    allFeedPosts: FeedPost[];
    isLoading: boolean;
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
}

// Definindo o contexto com um valor inicial undefined
const AppContext = createContext<AppContextType | undefined>(undefined);

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


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [usersMap, setUsersMap] = useState<Map<string, User>>(new Map()); // Novo Map para usuários
    
    const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => localStorage.getItem('onboarded') === 'true');
    const [places, setPlaces] = useState<Place[]>([]);
    const [placesMap, setPlacesMap] = useState<Map<string, Place>>(new Map()); // Novo Map para locais
    const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [goingIntentions, setGoingIntentions] = useState<GoingIntention[]>([]);
    const [swipes, setSwipes] = useState<{ swiped_id: string }[]>([]);
    const [livePostsByPlace, setLivePostsByPlace] = useState<{ [key: string]: LivePost[] }>({});
    const [activeLivePosts, setActiveLivePosts] = useState<{ place_id: string }[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [ownerPromotions, setOwnerPromotions] = useState<(Promotion & { claim_count: number; redeemed_count: number })[]>([]); // Tipagem ajustada para garantir que são números
    const [promotionClaims, setPromotionClaims] = useState<PromotionClaim[]>([]);
    const [ownerFeedPosts, setOwnerFeedPosts] = useState<FeedPost[]>([]);
    const [allFeedPosts, setAllFeedPosts] = useState<FeedPost[]>([]);
    const [ownedPlaceIds, setOwnedPlaceIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [newlyFormedMatch, setNewlyFormedMatch] = useState<Match | null>(null);
    const [hasNewNotification, setHasNewNotification] = useState<boolean>(false);

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
    
    const refreshOwnerPromotions = useCallback(async (userId: string) => {
        if (!userId) return;
        const { data, error } = await supabase.rpc('get_owner_promotions_with_counts', {
            user_id_param: userId,
        });
        if (error) {
            console.error("Error fetching owner promotions with counts:", error);
        } else {
            const mappedPromos = data.map(p => ({
                ...mapPromotion(p),
                claim_count: p.claim_count || 0, // Garantindo que é um número
                redeemed_count: p.redeemed_count || 0, // Garantindo que é um número
            }));
            setOwnerPromotions(mappedPromos);
        }
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
        return () => subscription.unsubscribe();
    }, []);

    const mergePlaces = useCallback((newPlaces: Place[]) => {
        setPlaces(prevPlaces => {
            const existingIds = new Set(prevPlaces.map(p => p.id));
            const uniqueNewPlaces = newPlaces.filter(p => !existingIds.has(p.id));
            const updatedPlaces = [...prevPlaces, ...uniqueNewPlaces];
            setPlacesMap(new Map(updatedPlaces.map(p => [p.id, p]))); // Atualiza o Map
            return updatedPlaces;
        });
    }, []);

    const fetchPlaces = useCallback(async (city: string, state: string, query?: string): Promise<Place[]> => {
        if (!city || !state) return [];
        setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    }, [mergePlaces]);

    const searchPlaces = useCallback(async (city: string, state: string, query: string): Promise<Place[]> => {
        if (!city || !state || !query.trim()) return [];
        try {
            const { data, error } = await supabase.functions.invoke('get-places-by-city', {
                body: { city, state, query: query.trim() },
            });

            if (error) throw error;
            
            if (Array.isArray(data)) {
                mergePlaces(data);
                return data;
            }
            
            throw new Error("A busca retornou um formato de dados inválido.");
        } catch (e: any) {
            console.error("Erro ao buscar locais:", e);
            throw new Error(e.message || "Não foi possível realizar a busca.");
        }
    }, [mergePlaces]);

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

    const fetchOwnerFeedPosts = useCallback(async (userId: string) => {
        const { data: postsData, error: postsError } = await supabase
            .from('feed_posts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (postsError) throw postsError;
        
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

    useEffect(() => {
        if (!session?.user) {
            setCurrentUser(null);
            setIsLoading(false);
            return;
        }

        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profileError) throw profileError;
                
                const mappedUser = mapProfileToUser(profileData, session.user);
                setCurrentUser(mappedUser);

                if (profileData?.city && profileData?.state) {
                    await fetchPlaces(profileData.city, profileData.state);
                }

                const { data: allProfilesData, error: allProfilesError } = await supabase.from('profiles').select('*');
                if (allProfilesError) throw allProfilesError;
                const allUsers = allProfilesData.map(p => mapProfileToUser(p, null));
                setUsers(allUsers);
                setUsersMap(new Map(allUsers.map(u => [u.id, u]))); // Atualiza o Map de usuários

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
                    matchesRes // Fetch existing matches
                ] = await Promise.all([
                    supabase.from('check_ins').select('*'),
                    supabase.from('going_intentions').select('*'),
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

                if (allPostsRes.error) throw allPostsRes.error;
                const allPostsData = allPostsRes.data;

                const postIds = allPostsData.map(p => p.id);
                const { data: likesData, error: likesError } = await supabase.from('post_likes').select('*').in('post_id', postIds);
                if (likesError) throw likesError;
                const { data: commentsData, error: commentsError } = await supabase.from('post_comments').select('*, profiles(name)').in('post_id', postIds).order('created_at', { ascending: true });
                if (commentsError) throw commentsError;

                const likesByPostId = likesData.reduce((acc, like) => { (acc[like.post_id] = acc[like.post_id] || []).push(like); return acc; }, {} as { [key: string]: any[] });
                const commentsByPostId = commentsData.reduce((acc, comment) => { (acc[comment.post_id] = acc[comment.post_id] || []).push(mapPostComment(comment)); return acc; }, {} as { [key: string]: PostComment[] });

                const mappedAllPosts: FeedPost[] = allPostsData.map((p: any) => {
                    const likes = likesByPostId[p.id] || [];
                    return {
                        id: p.id, placeId: p.place_id, placeName: p.place_name, placeLogoUrl: p.place_logo_url || '', type: p.type,
                        mediaUrl: p.media_url, caption: p.caption, likes: likes.length, comments: commentsByPostId[p.id] || [],
                        timestamp: new Date(p.created_at).toISOString(), isLikedByCurrentUser: likes.some(l => l.user_id === session.user.id),
                    };
                });
                setAllFeedPosts(mappedAllPosts);
                
                // Map matches
                if (matchesRes.error) throw matchesRes.error;
                const mappedMatches: Match[] = matchesRes.data.map((m: any) => ({
                    id: m.id,
                    userIds: [m.user1_id, m.user2_id],
                    createdAt: m.created_at,
                    otherUser: m.user1_id === session.user.id ? getUserById(m.user2_id) : getUserById(m.user1_id),
                    lastMessage: 'Novo Match!', // Placeholder
                }));
                setMatches(mappedMatches);


                const requiredPlaceIds = new Set([
                    ...favoritesRes.data.map(f => f.place_id),
                    ...claimsRes.data.map(c => c.promotion_id ? c.promotions.place_id : null).filter(Boolean),
                    ...ownerIds
                ]);
                
                const cachedPlaceIds = new Set(places.map(p => p.id));
                const missingPlaceIds = [...requiredPlaceIds].filter(id => !cachedPlaceIds.has(id));

                if (missingPlaceIds.length > 0) {
                    const { data: missingPlacesData, error: missingPlacesError } = await supabase.functions.invoke('get-places-by-ids', {
                        body: { placeIds: missingPlaceIds },
                    });
                    if (missingPlacesError) console.error("Error fetching missing place details:", missingPlacesError);
                    else if (Array.isArray(missingPlacesData)) mergePlaces(missingPlacesData);
                }

                if (mappedUser.role === 'owner') {
                    await fetchOwnerFeedPosts(session.user.id);
                    await refreshOwnerPromotions(session.user.id);
                }

                await refreshActiveLivePosts();

            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();

        const intervalId = setInterval(refreshActiveLivePosts, 60000);
        
        // Listener para Live Posts
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
        
        // Listener para Claims de Promoção
        const claimsChannel = supabase.channel('promotion-claims-listener').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'promotion_claims' }, () => {
            if (session?.user?.role === 'owner' && session.user.id) {
                refreshOwnerPromotions(session.user.id);
            }
        }).subscribe();

        // NOVO: Listener para Matches
        const matchesChannel = supabase.channel('matches-listener').on<Match>(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'matches' },
            (payload) => {
                const newMatchData = payload.new as any;
                const currentUserId = session?.user?.id;

                // Verifica se o match envolve o usuário atual
                if (currentUserId && (newMatchData.user1_id === currentUserId || newMatchData.user2_id === currentUserId)) {
                    const otherUserId = newMatchData.user1_id === currentUserId ? newMatchData.user2_id : newMatchData.user1_id;
                    const otherUser = getUserById(otherUserId);

                    if (otherUser) {
                        const newMatch: Match = {
                            id: newMatchData.id,
                            userIds: [newMatchData.user1_id, newMatchData.user2_id],
                            createdAt: newMatchData.created_at,
                            otherUser: otherUser,
                            lastMessage: 'Novo Match!',
                        };
                        
                        // 1. Adiciona à lista de matches
                        setMatches(prev => [...prev, newMatch]);
                        
                        // 2. Exibe o modal de notificação
                        setNewlyFormedMatch(newMatch);
                        
                        // 3. Ativa a notificação do chat
                        setHasNewNotification(true);
                    }
                }
            }
        ).subscribe();


        return () => {
            clearInterval(intervalId);
            supabase.removeChannel(livePostsChannel);
            supabase.removeChannel(claimsChannel);
            supabase.removeChannel(matchesChannel); // Limpa o novo listener
        };
    }, [session, refreshActiveLivePosts, fetchPlaces, fetchOwnerFeedPosts, mergePlaces, refreshOwnerPromotions, usersMap]); // Adicionado usersMap

    const completeOnboarding = () => {
        localStorage.setItem('onboarded', 'true');
        setHasOnboarded(true);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setSession(null);
    };
    
    const createLivePost = async (placeId: string, content: string) => {
        const toastId = showLoading('Publicando post ao vivo...');
        try {
            const { error } = await supabase.functions.invoke('create-live-post', {
                body: { placeId, content },
            });
            if (error) {
                const errorData = JSON.parse(error.context?.response?.text || '{}');
                throw new Error(errorData.error || 'Falha ao criar o post.');
            }
            updateToast(toastId, 'success', 'Post ao vivo publicado!');
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
            throw e;
        }
    };

    const updateLivePost = async (postId: string, newContent: string) => {
        const toastId = showLoading('Atualizando post ao vivo...');
        try {
            const { error } = await supabase.functions.invoke('update-live-post', {
                body: { postId, content: newContent },
            });
            if (error) {
                const errorData = JSON.parse(error.context?.response?.text || '{}');
                throw new Error(errorData.error || 'Falha ao atualizar o post.');
            }
            updateToast(toastId, 'success', 'Post ao vivo atualizado!');
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
            throw e;
        }
    };

    const deleteLivePost = async (postId: string, placeId: string) => {
        const toastId = showLoading('Apagando post ao vivo...');
        // Optimistic UI update
        const originalPosts = livePostsByPlace[placeId] || [];
        const updatedPosts = originalPosts.filter(p => p.id !== postId);
        setLivePostsByPlace(prev => ({
            ...prev,
            [placeId]: updatedPosts,
        }));
    
        try {
            const { error } = await supabase.functions.invoke('delete-live-post', {
                body: { postId },
            });
    
            if (error) {
                // Revert UI on failure
                setLivePostsByPlace(prev => ({
                    ...prev,
                    [placeId]: originalPosts,
                }));
                const errorData = JSON.parse(error.context?.response?.text || '{}');
                throw new Error(errorData.error || 'Falha ao apagar o post.');
            }
            updateToast(toastId, 'success', 'Post ao vivo apagado!');
        } catch (e) {
            // Revert UI on failure
            setLivePostsByPlace(prev => ({
                ...prev,
                [placeId]: originalPosts,
            }));
            updateToast(toastId, 'error', (e as Error).message);
            throw e; // Re-throw for the component to handle
        }
    };

    const deleteAllLivePosts = async () => {
        const toastId = showLoading('Excluindo todos os posts ao vivo...');
        try {
            const { error } = await supabase.functions.invoke('delete-all-live-posts', {
                method: 'POST',
            });
            if (error) {
                const errorData = JSON.parse(error.context?.response?.text || '{}');
                throw new Error(errorData.error || 'Falha ao excluir todos os posts ao vivo.');
            }
            setLivePostsByPlace({});
            setActiveLivePosts([]);
            updateToast(toastId, 'success', 'Todos os posts ao vivo foram excluídos com sucesso!');
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
            throw e;
        }
    };
    
    const deleteAllOwnerFeedPosts = async () => {
        if (!currentUser || currentUser.role !== 'owner') {
            showError("Apenas lojistas podem excluir posts do feed.");
            throw new Error("Apenas lojistas podem excluir posts do feed.");
        }
        const toastId = showLoading('Excluindo todos os seus posts do feed...');
        try {
            const { error: deleteError } = await supabase
                .from('feed_posts')
                .delete()
                .eq('user_id', currentUser.id);

            if (deleteError) {
                console.error('Error deleting owner feed posts:', deleteError);
                throw new Error(`Falha ao excluir posts: ${deleteError.message}`);
            }
            setOwnerFeedPosts([]);
            setAllFeedPosts(prev => prev.filter(p => p.placeId !== currentUser.id));
            updateToast(toastId, 'success', 'Todos os seus posts do feed foram excluídos com sucesso!');
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
            throw e;
        }
    };

    const claimPromotion = useCallback(async (promotionId: string): Promise<ClaimResult | undefined> => {
        if (!currentUser) {
            showError("Você precisa estar logado para reivindicar promoções.");
            return;
        }
        const toastId = showLoading('Reivindicando promoção...');
        try {
            const { data, error } = await supabase.functions.invoke('claim-promotion', {
                method: 'POST',
                body: { promotionId },
            });

            if (error) {
                const errorData = JSON.parse(error.context?.response?.text || '{}');
                throw new Error(errorData.error || 'Falha ao reivindicar a promoção.');
            }
            
            if (data.claimed && !promotionClaims.some(c => c.promotionId === promotionId)) {
                const { data: newClaimData, error: fetchError } = await supabase
                    .from('promotion_claims')
                    .select('*, promotions(*)')
                    .eq('promotion_id', promotionId)
                    .eq('user_id', currentUser.id)
                    .single();

                if (!fetchError && newClaimData) {
                    setPromotionClaims(prev => [...prev, mapClaim(newClaimData)]);
                }
            }

            // Se o usuário for um lojista, atualiza a contagem de promoções imediatamente
            if (currentUser.role === 'owner') {
                refreshOwnerPromotions(currentUser.id);
            }
            updateToast(toastId, 'success', data.message);
            return {
                success: data.success, message: data.message, isWinner: data.isWinner,
                claimOrder: data.claimOrder, claimId: data.claimId,
            };

        } catch (e: any) {
            console.error("Error claiming promotion:", e);
            updateToast(toastId, 'error', e.message);
            return { success: false, message: e.message, isWinner: false };
        }
    }, [currentUser, promotionClaims, refreshOwnerPromotions]);

    const getPlaceById = useCallback((id: string) => placesMap.get(id), [placesMap]); // Usando Map
    const getUserById = useCallback((id: string) => usersMap.get(id), [usersMap]); // Usando Map
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
        
        // 1. Encontra o registro do usuário atual para o local
        const userRecord = records.find(r => r.userId === currentUser.id && r.placeId === placeId);
        
        if (!userRecord) return 0;

        // 2. Conta quantos registros (incluindo o do usuário) têm um created_at menor ou igual
        // Usamos a comparação de string ISO para garantir a ordem cronológica precisa.
        const order = records.filter(r => 
            r.placeId === placeId && 
            r.createdAt <= userRecord.createdAt
        ).length;

        return order;
    }, [currentUser, checkIns, goingIntentions]);


    const checkInUser = async (placeId: string) => {
        if (!currentUser) return;
        const toastId = showLoading('Fazendo check-in...');
        try {
            await supabase.from('check_ins').delete().eq('user_id', currentUser.id);
            const { data, error } = await supabase.from('check_ins').insert({ user_id: currentUser.id, place_id: placeId }).select().single();
            if (!error && data) {
                setCheckIns(prev => [...prev.filter(ci => ci.userId !== currentUser.id), { userId: data.user_id, placeId: data.place_id, timestamp: Date.now(), createdAt: data.created_at }]);
                updateToast(toastId, 'success', 'Check-in realizado com sucesso!');
            } else {
                throw new Error(error?.message || "Falha ao fazer check-in.");
            }
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
        }
    };

    const checkOutUser = async () => {
        if (!currentUser) return;
        const toastId = showLoading('Fazendo check-out...');
        try {
            await supabase.from('check_ins').delete().eq('user_id', currentUser.id);
            setCheckIns(prev => prev.filter(ci => ci.userId !== currentUser.id));
            updateToast(toastId, 'success', 'Check-out realizado com sucesso!');
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
        }
    };

    const addGoingIntention = async (placeId: string) => {
        if (!currentUser) return;
        const currentIntentions = goingIntentions.filter(gi => gi.userId === currentUser.id);
        if (currentIntentions.length >= 3) {
            showError("Você já pode marcar 'Eu Vou' em no máximo 3 locais.");
            throw new Error("Você já pode marcar 'Eu Vou' em no máximo 3 locais.");
        }
        if (currentIntentions.some(gi => gi.placeId === placeId)) return;
        const toastId = showLoading('Registrando intenção...');
        try {
            const { data, error } = await supabase.from('going_intentions').insert({ user_id: currentUser.id, place_id: placeId }).select().single();
            if (error) {
                console.error("Error adding going intention:", error);
                throw new Error(`Falha ao adicionar intenção: ${error.message}`);
            }
            if (data) {
                setGoingIntentions(prev => [...prev, { userId: data.user_id, placeId: data.place_id, timestamp: Date.now(), createdAt: data.created_at }]);
                updateToast(toastId, 'success', 'Intenção de ida registrada!');
            }
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
            throw e;
        }
    };

    const removeGoingIntention = async (placeId: string) => {
        if (!currentUser) return;
        const toastId = showLoading('Removendo intenção...');
        try {
            const { error } = await supabase.from('going_intentions').delete().eq('user_id', currentUser.id).eq('place_id', placeId);
            if (!error) {
                setGoingIntentions(prev => prev.filter(gi => !(gi.userId === currentUser.id && gi.placeId === placeId)));
                updateToast(toastId, 'success', 'Intenção de ida removida!');
            } else {
                throw new Error(error.message);
            }
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
        }
    };

    const sendMessage = async (matchId: string, content: string) => {
        if (!currentUser) return;
        try {
            await supabase.from('messages').insert({ match_id: matchId, sender_id: currentUser.id, content });
        } catch (e: any) {
            showError(`Falha ao enviar mensagem: ${e.message}`);
        }
    };

    const updateUserProfile = async (updatedUser: Partial<User>) => {
        if (!currentUser || !session?.user) return;
        const toastId = showLoading('Salvando perfil...');
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

        try {
            const { data, error } = await supabase.from('profiles').update(dbPayload).eq('id', currentUser.id).select().single();
            if (error) {
                console.error("Error updating profile:", error);
                throw new Error(`Falha ao atualizar o perfil: ${error.message}`);
            }
            if (data) {
                setCurrentUser(mapProfileToUser(data, session.user));
                updateToast(toastId, 'success', 'Perfil salvo com sucesso!');
            }
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
            throw e;
        }
    };

    const updateCurrentUserState = (updatedFields: Partial<User>) => {
        if (currentUser) {
            setCurrentUser(prevUser => prevUser ? { ...prevUser, ...updatedFields } : null);
        }
    };

    const addFavorite = async (placeId: string) => {
        if (!currentUser || isFavorite(placeId)) return;
        const toastId = showLoading('Adicionando aos favoritos...');
        try {
            const { data, error } = await supabase.from('favorites').insert({ user_id: currentUser.id, place_id: placeId }).select().single();
            if (!error && data) {
                setFavorites(prev => [...prev, { id: data.id, userId: data.user_id, placeId: data.place_id }]);
                updateToast(toastId, 'success', 'Local adicionado aos favoritos!');
            } else {
                throw new Error(error?.message || "Falha ao adicionar favorito.");
            }
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
        }
    };

    const removeFavorite = async (placeId: string) => {
        if (!currentUser) return;
        const favorite = favorites.find(f => f.placeId === placeId);
        if (!favorite) return;
        const toastId = showLoading('Removendo dos favoritos...');
        try {
            const { error } = await supabase.from('favorites').delete().eq('id', favorite.id);
            if (!error) {
                setFavorites(prev => prev.filter(f => f.placeId !== placeId));
                updateToast(toastId, 'success', 'Local removido dos favoritos!');
            } else {
                throw new Error(error.message);
            }
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
        }
    };

    const createOwnerFeedPost = async (payload: CreatePostPayload) => {
        if (!currentUser || currentUser.role !== 'owner') {
            showError("Apenas lojistas podem criar postagens.");
            throw new Error("Apenas lojistas podem criar postagens.");
        }
        const toastId = showLoading('Criando postagem...');
        const placeDetails = getPlaceById(payload.placeId);
        const placeLogoUrl = placeDetails?.photoUrl || null;
        try {
            const { error } = await supabase.from('feed_posts').insert({
                user_id: currentUser.id, place_id: payload.placeId, place_name: placeDetails?.name || payload.placeId,
                place_logo_url: placeLogoUrl, type: payload.type, media_url: payload.mediaUrl, caption: payload.caption,
            }).select();
            if (error) {
                console.error("Error inserting feed post:", error);
                throw new Error(`Falha ao inserir post no feed. Detalhes: ${error.message}. Verifique se o local está associado corretamente.`);
            }
            await fetchOwnerFeedPosts(currentUser.id);
            updateToast(toastId, 'success', 'Postagem criada com sucesso!');
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
            throw e;
        }
    };

    const addOwnedPlace = async (place: Place) => {
        if (!currentUser || ownedPlaceIds.includes(place.id)) return;
        const toastId = showLoading('Adicionando local...');
        try {
            const { error } = await supabase.from('place_owners').insert({ user_id: currentUser.id, place_id: place.id });
            if (error) throw error;
            setOwnedPlaceIds(prev => [...prev, place.id]);
            mergePlaces([place]);
            updateToast(toastId, 'success', 'Local adicionado com sucesso!');
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
            throw e;
        }
    };

    const removeOwnedPlace = async (placeId: string) => {
        if (!currentUser) return;
        const toastId = showLoading('Removendo local...');
        try {
            const { error } = await supabase.from('place_owners').delete().eq('user_id', currentUser.id).eq('place_id', placeId);
            if (error) throw error;
            setOwnedPlaceIds(prev => prev.filter(id => id !== placeId));
            updateToast(toastId, 'success', 'Local removido com sucesso!');
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
            throw e;
        }
    };

    const verifyQrCode = async (qrCodeValue: string) => {
        const toastId = showLoading('Verificando QR Code...');
        try {
            const { data, error } = await supabase.functions.invoke('verify-qrcode', { body: { qrCodeValue } });
            if (error) throw error;
            if (data.status === 'success') {
                updateToast(toastId, 'success', data.message);
            } else {
                updateToast(toastId, 'error', data.message);
            }
            return data;
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
            throw e;
        }
    };

    const createPromotion = async (payload: CreatePromotionPayload) => {
        if (!currentUser) {
            showError("Usuário não autenticado.");
            throw new Error("Usuário não autenticado.");
        }
        const toastId = showLoading('Criando promoção...');
        try {
            const { error } = await supabase.from('promotions').insert({
                title: payload.title, description: payload.description, place_id: payload.placeId, place_name: payload.placeName,
                place_photo_url: payload.placePhotoUrl, promotion_type: payload.promotionType, limit_count: payload.limitCount,
                start_date: payload.startDate, end_date: payload.endDate, created_by: currentUser.id,
            });
            if (error) throw error;
            await refreshOwnerPromotions(currentUser.id);
            updateToast(toastId, 'success', 'Promoção criada com sucesso!');
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
            throw e;
        }
    };

    const updatePromotion = async (promotionId: string, payload: Partial<CreatePromotionPayload>) => {
        if (!currentUser) {
            showError("Usuário não autenticado.");
            throw new Error("Usuário não autenticado.");
        }
        const toastId = showLoading('Atualizando promoção...');
        const dbPayload: { [key: string]: any } = {};
        if (payload.title !== undefined) dbPayload.title = payload.title;
        if (payload.description !== undefined) dbPayload.description = payload.description;
        if (payload.limitCount !== undefined) dbPayload.limit_count = payload.limitCount;
        if (payload.endDate !== undefined) dbPayload.end_date = new Date(payload.endDate).toISOString();

        try {
            const { data, error } = await supabase.from('promotions').update(dbPayload).eq('id', promotionId).eq('created_by', currentUser.id).select().single();
            if (error) throw error;
            if (data) {
                await refreshOwnerPromotions(currentUser.id);
                updateToast(toastId, 'success', 'Promoção atualizada com sucesso!');
            }
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
            throw e;
        }
    };

    const deletePromotion = async (promotionId: string) => {
        if (!currentUser) {
            showError("Usuário não autenticado.");
            throw new Error("Usuário não autenticado.");
        }
        const toastId = showLoading('Excluindo promoção...');
        try {
            const { error: claimsError } = await supabase.from('promotion_claims').delete().eq('promotion_id', promotionId);
            if (claimsError) throw new Error(`Falha ao remover reivindicações: ${claimsError.message}`);
            const { error } = await supabase.from('promotions').delete().eq('id', promotionId).eq('created_by', currentUser.id);
            if (error) throw new Error(`Falha ao excluir promoção: ${error.message}`);
            setOwnerPromotions(prev => prev.filter(p => p.id !== promotionId));
            updateToast(toastId, 'success', 'Promoção excluída com sucesso!');
        } catch (e: any) {
            updateToast(toastId, 'error', e.message);
            throw e;
        }
    };
    
    const likePost = async (postId: string) => {
        if (!currentUser) return;
        try {
            const { error } = await supabase.from('post_likes').insert({ user_id: currentUser.id, post_id: postId });
            if (error) throw error;
            setAllFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1, isLikedByCurrentUser: true } : p));
            setOwnerFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1, isLikedByCurrentUser: true } : p));
        } catch (e: any) {
            showError(`Falha ao curtir post: ${e.message}`);
        }
    };

    const unlikePost = async (postId: string) => {
        if (!currentUser) return;
        try {
            const { error } = await supabase.from('post_likes').delete().eq('user_id', currentUser.id).eq('post_id', postId);
            if (error) throw error;
            setAllFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes - 1, isLikedByCurrentUser: false } : p));
            setOwnerFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes - 1, isLikedByCurrentUser: false } : p));
        } catch (e: any) {
            showError(`Falha ao descurtir post: ${e.message}`);
        }
    };

    const addCommentToPost = async (postId: string, content: string) => {
        if (!currentUser) return;
        try {
            const { data, error } = await supabase.from('post_comments').insert({ user_id: currentUser.id, post_id: postId, content }).select().single();
            if (error) throw error;
            const newComment: PostComment = {
                id: data.id, userId: currentUser.id, postId: postId, content: data.content, createdAt: data.created_at,
                profiles: { name: currentUser.name },
            };
            setAllFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
            setOwnerFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
        } catch (e: any) {
            showError(`Falha ao adicionar comentário: ${e.message}`);
        }
    };

    const value = {
        isAuthenticated: !!session?.user, hasOnboarded, currentUser, places, users, checkIns, matches, favorites,
        goingIntentions, swipes, livePostsByPlace, activeLivePosts, promotions, ownerPromotions, promotionClaims,
        allFeedPosts, isLoading, error, logout, completeOnboarding, checkInUser, checkOutUser, getCurrentCheckIn,
        getPlaceById, getUserById, sendMessage, updateUserProfile, updateCurrentUserState, addGoingIntention,
        removeGoingIntention, getCurrentGoingIntention, isUserGoingToPlace, fetchPlaces, searchPlaces,
        newlyFormedMatch, clearNewMatch, addFavorite, removeFavorite, isFavorite, hasNewNotification,
        clearChatNotifications, fetchLivePostsForPlace, createLivePost, updateLivePost, deleteLivePost, getLivePostCount, getActivePromotionsForPlace,
        claimPromotion, createOwnerFeedPost, ownerFeedPosts, ownedPlaceIds, addOwnedPlace, removeOwnedPlace,
        verifyQrCode, createPromotion, updatePromotion, deletePromotion, deleteAllLivePosts, deleteAllOwnerFeedPosts,
        likePost, unlikePost, addCommentToPost, getUserOrderForPlace,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};