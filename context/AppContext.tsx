import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Place, CheckIn, Match, Message, GoingIntention } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface Favorite {
    id: string;
    userId: string;
    placeId: string;
}

interface AppContextType {
    isAuthenticated: boolean;
    hasOnboarded: boolean;
    currentUser: User | null;
    places: Place[];
    users: User[];
    checkIns: CheckIn[];
    matches: Match[];
    favorites: Favorite[]; // Novo estado para favoritos
    goingIntentions: GoingIntention[];
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
    fetchPlaces: (city: string, state: string, query?: string) => Promise<void>;
    newlyFormedMatch: Match | null;
    clearNewMatch: () => void;
    addFavorite: (placeId: string) => Promise<void>; // Nova função
    removeFavorite: (placeId: string) => Promise<void>; // Nova função
    isFavorite: (placeId: string) => boolean; // Nova função
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
    const [favorites, setFavorites] = useState<Favorite[]>([]); // Novo estado
    const [goingIntentions, setGoingIntentions] = useState<GoingIntention[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [newlyFormedMatch, setNewlyFormedMatch] = useState<Match | null>(null);

    // Handle auth changes
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Fetch initial data and set up real-time listeners
    useEffect(() => {
        if (!session?.user) {
            setCurrentUser(null);
            setUsers([]);
            setMatches([]);
            setFavorites([]);
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);

            const profilePromise = supabase.from('profiles').select('*').eq('id', session.user.id).single();
            const usersPromise = supabase.from('profiles').select('*').neq('id', session.user.id);
            const matchesPromise = supabase.from('matches').select('*').or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);
            const favoritesPromise = supabase.from('favorites').select('*').eq('user_id', session.user.id); // Fetch favorites

            const [{ data: profileData, error: profileError }, { data: usersData, error: usersError }, { data: matchesData, error: matchesError }, { data: favoritesData, error: favoritesError }] = await Promise.all([profilePromise, usersPromise, matchesPromise, favoritesPromise]);

            if (profileError) console.error('Error fetching profile:', profileError);
            if (usersError) console.error('Error fetching users:', usersError);
            if (matchesError) console.error('Error fetching matches:', matchesError);
            if (favoritesError) console.error('Error fetching favorites:', favoritesError);

            const allUsers = (usersData || []).map((profile: any) => ({
                ...profile,
                email: 'hidden',
                sexualOrientation: profile.sexual_orientation,
                isAvailableForMatch: profile.is_available_for_match,
                matchPreferences: profile.match_preferences,
            }));
            setUsers(allUsers);

            if (profileData) {
                const userProfile: User = {
                    ...profileData,
                    email: session.user.email!,
                    sexualOrientation: profileData.sexual_orientation,
                    isAvailableForMatch: profileData.is_available_for_match,
                    matchPreferences: profileData.match_preferences,
                };
                setCurrentUser(userProfile);
            }

            if (matchesData) {
                const populatedMatches = matchesData.map(match => {
                    const otherUserId = match.user1_id === session.user.id ? match.user2_id : match.user1_id;
                    const otherUser = allUsers.find(u => u.id === otherUserId);
                    return {
                        id: match.id,
                        userIds: [match.user1_id, match.user2_id],
                        createdAt: match.created_at,
                        otherUser: otherUser,
                        lastMessage: "Clique para ver a conversa"
                    };
                }).filter(m => m.otherUser); // Filter out matches where other user wasn't found
                setMatches(populatedMatches);
            }
            
            if (favoritesData) {
                const formattedFavorites: Favorite[] = favoritesData.map((fav: any) => ({
                    id: fav.id,
                    userId: fav.user_id,
                    placeId: fav.place_id,
                }));
                setFavorites(formattedFavorites);
            }
        };

        fetchData();

        const matchesChannel = supabase
            .channel('public:matches')
            .on<Match>(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'matches', filter: `or(user1_id.eq.${session.user.id},user2_id.eq.${session.user.id})` },
                async (payload) => {
                    const newMatchData = payload.new as any;
                    const otherUserId = newMatchData.user1_id === session.user.id ? newMatchData.user2_id : newMatchData.user1_id;
                    
                    const { data: otherUserData, error } = await supabase.from('profiles').select('*').eq('id', otherUserId).single();
                    if (error) {
                        console.error("Could not fetch other user for new match notification", error);
                        return;
                    }

                    const otherUser: User = {
                        ...otherUserData,
                        email: 'hidden',
                        sexualOrientation: otherUserData.sexual_orientation,
                        isAvailableForMatch: otherUserData.is_available_for_match,
                        matchPreferences: otherUserData.match_preferences,
                    };

                    const populatedMatch: Match = {
                        id: newMatchData.id,
                        userIds: [newMatchData.user1_id, newMatchData.user2_id],
                        createdAt: newMatchData.created_at,
                        otherUser: otherUser,
                        lastMessage: "Diga olá!"
                    };

                    setMatches(prev => [...prev, populatedMatch]);
                    setNewlyFormedMatch(populatedMatch);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(matchesChannel);
        };
    }, [session]);

    const fetchPlaces = async (city: string, state: string, query?: string) => {
        if (!city || !state) return;
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.functions.invoke('get-places-by-city', {
                body: { city, state, query },
            });

            if (error) throw error;

            if (Array.isArray(data)) {
                setPlaces(data);
            } else {
                throw new Error("Recebeu dados inválidos da função de locais.");
            }

        } catch (e: any) {
            console.error("Falha ao buscar locais:", e);
            setError("Não foi possível carregar os locais. Verifique sua chave de API do Google e tente novamente.");
            setPlaces([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.city && currentUser?.state) {
            fetchPlaces(currentUser.city, currentUser.state);
        } else if (session) {
            setIsLoading(false);
        }
    }, [currentUser?.city, currentUser?.state, session]);

    useEffect(() => {
        // Este efeito simula interações de outros usuários com base em usuários REAIS do BD.
        const initializeMockInteractions = () => {
            // Executa apenas uma vez quando temos locais e usuários, para evitar sobrescrever as ações do usuário atual.
            if (places.length === 0 || users.length === 0 || checkIns.length > 0 || goingIntentions.length > 0) return;

            const simulatedCheckins: CheckIn[] = [];
            // Vamos fazer check-in de até 7 usuários
            const usersToCheckIn = users.slice(0, 7);
            usersToCheckIn.forEach((user, index) => {
                if (places.length > 0) {
                    const placeIndex = index % places.length;
                    simulatedCheckins.push({ userId: user.id, placeId: places[placeIndex].id, timestamp: Date.now() });
                }
            });
            setCheckIns(simulatedCheckins);

            const simulatedIntentions: GoingIntention[] = [];
            // Vamos fazer os próximos 4 usuários terem intenções
            const usersWithIntentions = users.slice(7, 11);
            usersWithIntentions.forEach((user, index) => {
                 if (places.length > 0) {
                    const placeIndex = (index + 4) % places.length;
                    simulatedIntentions.push({ userId: user.id, placeId: places[placeIndex].id, timestamp: Date.now() });
                 }
            });
            setGoingIntentions(simulatedIntentions);
        };

        initializeMockInteractions();
    }, [places, users, checkIns.length, goingIntentions.length]);

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
    };

    const completeOnboarding = () => {
        localStorage.setItem('onboarded', 'true');
        setHasOnboarded(true);
    };

    const removeGoingIntention = () => {
        if (!currentUser) return;
        setGoingIntentions(prev => prev.filter(gi => gi.userId !== currentUser.id));
    };

    const checkOutUser = () => {
        if (!currentUser) return;
        setCheckIns(prev => prev.filter(ci => ci.userId !== currentUser.id));
    };

    const addGoingIntention = (placeId: string) => {
        if (!currentUser) return;
        checkOutUser();
        const newIntentions = goingIntentions.filter(gi => gi.userId !== currentUser.id);
        newIntentions.push({ userId: currentUser.id, placeId, timestamp: Date.now() });
        setGoingIntentions(newIntentions);
    };

    const checkInUser = (placeId: string) => {
        if (!currentUser) return;
        removeGoingIntention();
        const newCheckIns = checkIns.filter(ci => ci.userId !== currentUser.id);
        newCheckIns.push({ userId: currentUser.id, placeId, timestamp: Date.now() });
        setCheckIns(newCheckIns);
    };

    const getCurrentCheckIn = () => {
        if (!currentUser) return undefined;
        return checkIns.find(ci => ci.userId === currentUser.id);
    };
    
    const getCurrentGoingIntention = () => {
        if (!currentUser) return undefined;
        return goingIntentions.find(gi => gi.userId === currentUser.id);
    };
    
    const getPlaceById = (id: string) => places.find(p => p.id === id);
    const getUserById = (id: string) => {
        if (currentUser?.id === id) return currentUser;
        return users.find(u => u.id === id);
    }

    const sendMessage = async (matchId: string, text: string) => {
        if (!currentUser) return;
        const { error } = await supabase.from('messages').insert({ match_id: matchId, sender_id: currentUser.id, content: text });
        if (error) {
            console.error("Error sending message:", error);
        }
    };

    const updateUserProfile = async (updatedProfile: Partial<User>) => {
        if (!currentUser) return;

        const dbUpdateData: { [key: string]: any } = { ...updatedProfile };
        
        if (updatedProfile.sexualOrientation) {
            dbUpdateData.sexual_orientation = updatedProfile.sexualOrientation;
            delete dbUpdateData.sexualOrientation;
        }
        if (updatedProfile.isAvailableForMatch !== undefined) {
            dbUpdateData.is_available_for_match = updatedProfile.isAvailableForMatch;
            delete dbUpdateData.isAvailableForMatch;
        }
        if (updatedProfile.matchPreferences) {
            dbUpdateData.match_preferences = updatedProfile.matchPreferences;
            delete dbUpdateData.matchPreferences;
        }
        
        delete dbUpdateData.id;
        delete dbUpdateData.email;
        dbUpdateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('profiles')
            .update(dbUpdateData)
            .eq('id', currentUser.id)
            .select()
            .single();

        if (error) {
            console.error("Error updating profile:", error);
            setError("Não foi possível salvar seu perfil.");
        } else if (data) {
            const updatedUser: User = {
                ...data,
                email: currentUser.email,
                sexualOrientation: data.sexual_orientation,
                isAvailableForMatch: data.is_available_for_match,
                matchPreferences: data.match_preferences,
            };
            setCurrentUser(updatedUser);
            setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
            setError(null);
        }
    };
    
    const isFavorite = (placeId: string) => favorites.some(fav => fav.placeId === placeId);

    const addFavorite = async (placeId: string) => {
        if (!currentUser) return;
        const { data, error } = await supabase.from('favorites').insert({ user_id: currentUser.id, place_id: placeId }).select().single();
        if (error) {
            console.error("Error adding favorite:", error);
            setError("Não foi possível adicionar aos favoritos.");
        } else if (data) {
            const newFavorite: Favorite = { id: data.id, userId: data.user_id, placeId: data.place_id };
            setFavorites(prev => [...prev, newFavorite]);
        }
    };

    const removeFavorite = async (placeId: string) => {
        if (!currentUser) return;
        const { error } = await supabase.from('favorites').delete().eq('user_id', currentUser.id).eq('place_id', placeId);
        if (error) {
            console.error("Error removing favorite:", error);
            setError("Não foi possível remover dos favoritos.");
        } else {
            setFavorites(prev => prev.filter(fav => fav.placeId !== placeId));
        }
    };

    const value = {
        isAuthenticated: !!session,
        hasOnboarded,
        currentUser,
        places,
        users,
        checkIns,
        matches,
        favorites, // Adicionado
        goingIntentions,
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
        clearNewMatch: () => setNewlyFormedMatch(null),
        addFavorite, // Adicionado
        removeFavorite, // Adicionado
        isFavorite, // Adicionado
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};