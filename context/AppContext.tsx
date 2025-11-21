import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, Place, CheckIn, Match, Message, GoingIntention } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

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
    livePostsByPlace: { [key: string]: LivePost[] };
    activeLivePosts: LivePost[];
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
    const [livePostsByPlace, setLivePostsByPlace] = useState<{ [key: string]: LivePost[] }>({});
    const [activeLivePosts, setActiveLivePosts] = useState<LivePost[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [newlyFormedMatch, setNewlyFormedMatch] = useState<Match | null>(null);
    const [hasNewNotification, setHasNewNotification] = useState<boolean>(false);

    const refreshActiveLivePosts = useCallback(async () => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('live_posts')
            .select('*, profiles(id, name, photos)')
            .gt('created_at', oneHourAgo)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error("Error refreshing active live posts:", error);
        } else {
            const posts = (data || []) as LivePost[];
            setActiveLivePosts(posts);

            const postsByPlace = posts.reduce((acc, post) => {
                const placeId = post.place_id;
                if (!acc[placeId]) {
                    acc[placeId] = [];
                }
                acc[placeId].push(post);
                return acc;
            }, {} as { [key: string]: LivePost[] });

            setLivePostsByPlace(postsByPlace);
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
                setCurrentUser(profileData as User);

                const { data: allProfilesData, error: allProfilesError } = await supabase.from('profiles').select('*');
                if (allProfilesError) throw allProfilesError;
                setUsers(allProfilesData as User[]);

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
                (payload) => {
                    refreshActiveLivePosts();
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
        await refreshActiveLivePosts();
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
        if (!currentUser) return;
        const { data, error } = await supabase.from('profiles').update(updatedUser).eq('id', currentUser.id).select().single();
        if (!error && data) {
            setCurrentUser(data as User);
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