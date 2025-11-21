import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, Place, CheckIn, Match, Message, GoingIntention } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

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
    profiles: Pick<User, 'id' | 'name' | 'photos'>;
}

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
    isLoading: boolean;
    error: string | null;
    logout: () => void;
    completeOnboarding: () => void;
    checkInUser: (placeId: string) => void;
    checkOutUser: () => void;
    getCurrentCheckIn: () => CheckIn | undefined;
    getPlaceById: (id: string) => Place | undefined;
    getUserById: (id: string) => User | undefined;
    sendMessage: (matchId: string, text: string) => Promise<void>;
    updateUserProfile: (updatedUser: Partial<User>) => Promise<void>;
    updateCurrentUserState: (updatedFields: Partial<User>) => void;
    addGoingIntention: (placeId: string) => void;
    removeGoingIntention: () => void;
    getCurrentGoingIntention: () => GoingIntention | undefined;
    fetchPlaces: (city: string, state: string, query?: string) => Promise<Place[]>;
    newlyFormedMatch: Match | null;
    clearNewMatch: () => void;
    addFavorite: (placeId: string) => Promise<void>;
    removeFavorite: (placeId: string) => Promise<void>;
    isFavorite: (placeId: string) => boolean;
    hasNewNotification: boolean;
    clearChatNotifications: () => void;
    fetchLivePostsForPlace: (placeId: string) => Promise<void>;
    createLivePost: (placeId: string, content: string) => Promise<void>;
    getLivePostCount: (placeId: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper function to map snake_case from DB to camelCase for the app
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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    
    const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => localStorage.getItem('onboarded') === 'true');
    const [places, setPlaces] = useState<Place[]>([]);
    const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [goingIntentions, setGoingIntentions] = useState<GoingIntention[]>([]);
    const [swipes, setSwipes] = useState<{ swiped_id: string }[]>([]);
    const [livePostsByPlace, setLivePostsByPlace] = useState<{ [key: string]: LivePost[] }>({});
    const [activeLivePosts, setActiveLivePosts] = useState<{ place_id: string }[]>([]);
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

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!session?.user) {
            setCurrentUser(null);
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profileError) throw profileError;
                
                setCurrentUser(mapProfileToUser(profileData, session.user));

                const { data: allProfilesData, error: allProfilesError } = await supabase.from('profiles').select('*');
                if (allProfilesError) throw allProfilesError;
                setUsers(allProfilesData.map(p => mapProfileToUser(p, null)));

                if (profileData?.city && profileData?.state) {
                    await fetchPlaces(profileData.city, profileData.state);
                }

                const { data: checkInsData, error: checkInsError } = await supabase.from('check_ins').select('*');
                if (checkInsError) throw checkInsError;
                setCheckIns(checkInsData.map(c => ({ userId: c.user_id, placeId: c.place_id, timestamp: new Date(c.created_at).getTime() })));

                const { data: goingData, error: goingError } = await supabase.from('going_intentions').select('*');
                if (goingError) throw goingError;
                setGoingIntentions(goingData.map(g => ({ userId: g.user_id, placeId: g.place_id, timestamp: new Date(g.created_at).getTime() })));

                const { data: favoritesData, error: favoritesError } = await supabase.from('favorites').select('*').eq('user_id', session.user.id);
                if (favoritesError) throw favoritesError;
                setFavorites(favoritesData.map(f => ({ id: f.id, userId: f.user_id, placeId: f.place_id })));

                const { data: swipesData, error: swipesError } = await supabase.from('swipes').select('swiped_id').eq('swiper_id', session.user.id);
                if (swipesError) throw swipesError;
                setSwipes(swipesData);
                
                await refreshActiveLivePosts();

            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        const intervalId = setInterval(() => {
            refreshActiveLivePosts();
        }, 60000); // Refresh every 60 seconds

        const livePostsChannel = supabase
            .channel('live-posts-feed')
            .on<LivePost>(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'live_posts' },
                async (payload) => {
                    const newPost = payload.new as any;
                    await refreshActiveLivePosts();
                    const { data: profileData } = await supabase.from('profiles').select('id, name, photos').eq('id', newPost.user_id).single();
                    if (profileData) {
                        newPost.profiles = profileData;
                        setLivePostsByPlace(prev => ({
                            ...prev,
                            [newPost.place_id]: [newPost, ...(prev[newPost.place_id] || [])]
                        }));
                    }
                }
            )
            .subscribe();

        return () => {
            clearInterval(intervalId);
            supabase.removeChannel(livePostsChannel);
        };
    }, [session, refreshActiveLivePosts]);

    const completeOnboarding = () => {
        localStorage.setItem('onboarded', 'true');
        setHasOnboarded(true);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setSession(null);
    };

    const fetchPlaces = async (city: string, state: string, query?: string): Promise<Place[]> => {
        if (!city || !state) return [];
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.functions.invoke('get-places-by-city', {
                body: { city, state, query },
            });
            if (error) throw error;
            if (Array.isArray(data)) {
                setPlaces(prevPlaces => {
                    const existingIds = new Set(prevPlaces.map(p => p.id));
                    const newPlaces = data.filter(p => !existingIds.has(p.id));
                    return [...prevPlaces, ...newPlaces];
                });
                return data;
            }
            throw new Error("Dados de locais inválidos.");
        } catch (e: any) {
            setError("Não foi possível carregar os locais.");
            return [];
        } finally {
            setIsLoading(false);
        }
    };
    
    const fetchLivePostsForPlace = async (placeId: string) => {
        const { data, error } = await supabase
            .from('live_posts')
            .select('*, profiles(id, name, photos)')
            .eq('place_id', placeId)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            console.error(`Error fetching live posts for ${placeId}:`, error);
        } else {
            setLivePostsByPlace(prev => ({ ...prev, [placeId]: data as LivePost[] }));
        }
    };

    const createLivePost = async (placeId: string, content: string) => {
        const { error } = await supabase.functions.invoke('create-live-post', {
            body: { placeId, content },
        });
        if (error) {
            const errorData = JSON.parse(error.context?.response?.text || '{}');
            throw new Error(errorData.error || 'Falha ao criar o post.');
        }
    };

    const getPlaceById = (id: string) => places.find(p => p.id === id);
    const getUserById = (id: string) => users.find(u => u.id === id);
    const getCurrentCheckIn = () => checkIns.find(ci => ci.userId === currentUser?.id);
    const getCurrentGoingIntention = () => goingIntentions.find(gi => gi.userId === currentUser?.id);
    const isFavorite = (placeId: string) => favorites.some(f => f.placeId === placeId);
    const clearNewMatch = () => setNewlyFormedMatch(null);
    const clearChatNotifications = () => setHasNewNotification(false);
    const getLivePostCount = (placeId: string) => activeLivePosts.filter(p => p.place_id === placeId).length;

    const checkInUser = async (placeId: string) => {
        if (!currentUser) return;
        await supabase.from('check_ins').delete().eq('user_id', currentUser.id);
        await supabase.from('going_intentions').delete().eq('user_id', currentUser.id);
        const { data, error } = await supabase.from('check_ins').insert({ user_id: currentUser.id, place_id: placeId }).select().single();
        if (!error && data) {
            setCheckIns(prev => [...prev.filter(ci => ci.userId !== currentUser.id), { userId: data.user_id, placeId: data.place_id, timestamp: Date.now() }]);
            setGoingIntentions(prev => prev.filter(gi => gi.userId !== currentUser.id));
        }
    };

    const checkOutUser = async () => {
        if (!currentUser) return;
        await supabase.from('check_ins').delete().eq('user_id', currentUser.id);
        setCheckIns(prev => prev.filter(ci => ci.userId !== currentUser.id));
    };

    const addGoingIntention = async (placeId: string) => {
        if (!currentUser) return;
        await supabase.from('check_ins').delete().eq('user_id', currentUser.id);
        await supabase.from('going_intentions').delete().eq('user_id', currentUser.id);
        const { data, error } = await supabase.from('going_intentions').insert({ user_id: currentUser.id, place_id: placeId }).select().single();
        if (!error && data) {
            setGoingIntentions(prev => [...prev.filter(gi => gi.userId !== currentUser.id), { userId: data.user_id, placeId: data.place_id, timestamp: Date.now() }]);
            setCheckIns(prev => prev.filter(ci => ci.userId !== currentUser.id));
        }
    };

    const removeGoingIntention = async () => {
        if (!currentUser) return;
        await supabase.from('going_intentions').delete().eq('user_id', currentUser.id);
        setGoingIntentions(prev => prev.filter(gi => gi.userId !== currentUser.id));
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

        const { data, error } = await supabase
            .from('profiles')
            .update(dbPayload)
            .eq('id', currentUser.id)
            .select()
            .single();

        if (error) {
            console.error("Error updating profile:", error);
            throw new Error(`Falha ao atualizar o perfil: ${error.message}`);
        }

        if (data) {
            setCurrentUser(mapProfileToUser(data, session.user));
        }
    };

    const updateCurrentUserState = (updatedFields: Partial<User>) => {
        if (currentUser) {
            setCurrentUser(prevUser => prevUser ? { ...prevUser, ...updatedFields } : null);
        }
    };

    const addFavorite = async (placeId: string) => {
        if (!currentUser || isFavorite(placeId)) return;
        const { data, error } = await supabase.from('favorites').insert({ user_id: currentUser.id, place_id: placeId }).select().single();
        if (!error && data) {
            setFavorites(prev => [...prev, { id: data.id, userId: data.user_id, placeId: data.place_id }]);
        }
    };

    const removeFavorite = async (placeId: string) => {
        if (!currentUser) return;
        const favorite = favorites.find(f => f.placeId === placeId);
        if (!favorite) return;
        const { error } = await supabase.from('favorites').delete().eq('id', favorite.id);
        if (!error) {
            setFavorites(prev => prev.filter(f => f.placeId !== placeId));
        }
    };

    const value = {
        isAuthenticated: !!session?.user,
        hasOnboarded,
        currentUser,
        places,
        users,
        checkIns,
        matches,
        favorites,
        goingIntentions,
        swipes,
        livePostsByPlace,
        activeLivePosts,
        isLoading,
        error,
        logout,
        completeOnboarding,
        checkInUser,
        checkOutUser,
        getCurrentCheckIn,
        getPlaceById,
        getUserById,
        sendMessage,
        updateUserProfile,
        updateCurrentUserState,
        addGoingIntention,
        removeGoingIntention,
        getCurrentGoingIntention,
        fetchPlaces,
        newlyFormedMatch,
        clearNewMatch,
        addFavorite,
        removeFavorite,
        isFavorite,
        hasNewNotification,
        clearChatNotifications,
        fetchLivePostsForPlace,
        createLivePost,
        getLivePostCount,
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