import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, Place, CheckIn, Match, Message, GoingIntention } from '../types';
import { generateMockPlaces, generateMockUsers } from '../services/mockDataService';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface AppContextType {
    isAuthenticated: boolean;
    hasOnboarded: boolean;
    currentUser: User | null;
    places: Place[];
    users: User[];
    checkIns: CheckIn[];
    matches: Match[];
    messages: Message[];
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
    createMatch: (otherUserId: string) => void;
    sendMessage: (matchId: string, text: string) => void;
    getMessagesForMatch: (matchId: string) => Message[];
    updateUserProfile: (updatedUser: Partial<User>) => Promise<void>;
    addGoingIntention: (placeId: string) => void;
    removeGoingIntention: () => void;
    getCurrentGoingIntention: () => GoingIntention | undefined;
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
    const [messages, setMessages] = useState<Message[]>([]);
    const [goingIntentions, setGoingIntentions] = useState<GoingIntention[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Handle auth changes
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Fetch current user profile and all users
    useEffect(() => {
        if (session?.user) {
            setIsLoading(true);
            // Fetch current user's profile
            supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
                .then(({ data, error }) => {
                    if (error) {
                        console.error('Error fetching profile:', error);
                        setError('Não foi possível carregar seu perfil.');
                    } else if (data) {
                        const userProfile: User = {
                            ...data,
                            email: session.user.email!,
                            sexualOrientation: data.sexual_orientation,
                            isAvailableForMatch: data.is_available_for_match,
                        };
                        setCurrentUser(userProfile);
                    }
                });

            // Fetch all users
            supabase
                .from('profiles')
                .select('*')
                .then(({ data, error }) => {
                    if (error) {
                        console.error('Error fetching users:', error);
                        setError('Não foi possível carregar outros usuários.');
                    } else if (data) {
                        const allUsers = data.map((profile: any) => ({
                            ...profile,
                            email: 'hidden', // Don't expose other users' emails
                            sexualOrientation: profile.sexual_orientation,
                            isAvailableForMatch: profile.is_available_for_match,
                        }));
                        setUsers(allUsers);
                    }
                    setIsLoading(false);
                });
        } else {
            setCurrentUser(null);
            setUsers([]);
        }
    }, [session]);


    const initializeMockData = useCallback(async () => {
        // This function now only loads data that is still mocked
        setIsLoading(true);
        setError(null);
        try {
            const mockPlaces = await generateMockPlaces();
            setPlaces(mockPlaces);
            
            // Generate some mock users for check-ins and intentions if no real users exist yet
            if (users.length < 15) {
                const mockUsers = await generateMockUsers(15);
                const simulatedCheckins: CheckIn[] = [];
                mockUsers.slice(1, 8).forEach((user, index) => {
                    if (mockPlaces.length > 0) {
                         const placeIndex = index % mockPlaces.length;
                         simulatedCheckins.push({
                             userId: user.id,
                             placeId: mockPlaces[placeIndex].id,
                             timestamp: Date.now()
                         });
                    }
                });
                setCheckIns(simulatedCheckins);
    
                const simulatedIntentions: GoingIntention[] = [];
                mockUsers.slice(8, 12).forEach((user, index) => {
                    if (mockPlaces.length > 0) {
                        const placeIndex = (index + 4) % mockPlaces.length;
                        simulatedIntentions.push({
                            userId: user.id,
                            placeId: mockPlaces[placeIndex].id,
                            timestamp: Date.now()
                        });
                    }
                });
                setGoingIntentions(simulatedIntentions);
            }

        } catch (e) {
            console.error("Failed to initialize mock data:", e);
            setError("Não foi possível carregar os dados do app. Verifique sua chave de API do Gemini e atualize a página.");
        } finally {
            // Loading is handled by session management now
            // setIsLoading(false);
        }
    }, [users.length]);

    useEffect(() => {
        initializeMockData();
    }, [initializeMockData]);

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

    const createMatch = (otherUserId: string) => {
        if (!currentUser) return;
        const matchId = `match_${Math.random().toString(36).substr(2, 9)}`;
        const newMatch: Match = {
            id: matchId,
            userIds: [currentUser.id, otherUserId],
            timestamp: Date.now(),
            lastMessage: "Vocês deram match! Diga oi!"
        };
        setMatches(prev => [...prev, newMatch]);
    };

    const sendMessage = (matchId: string, text: string) => {
        if (!currentUser) return;
        const messageId = `msg_${Math.random().toString(36).substr(2, 9)}`;
        const newMessage: Message = {
            id: messageId,
            matchId,
            senderId: currentUser.id,
            text,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, newMessage]);

        setMatches(prevMatches => prevMatches.map(match => 
            match.id === matchId ? { ...match, lastMessage: text } : match
        ));
    };
    
    const getMessagesForMatch = (matchId: string) => {
        return messages.filter(m => m.matchId === matchId).sort((a,b) => a.timestamp - b.timestamp);
    };

    const updateUserProfile = async (updatedProfile: Partial<User>) => {
        if (!currentUser) return;
        
        const { id, email, ...updateData } = updatedProfile;

        const profileDataToUpdate = {
            ...updateData,
            sexual_orientation: updatedProfile.sexualOrientation,
            is_available_for_match: updatedProfile.isAvailableForMatch,
            updated_at: new Date().toISOString(),
        };
        // remove undefined properties that came from mapping
        delete profileDataToUpdate.sexualOrientation;
        delete profileDataToUpdate.isAvailableForMatch;


        const { data, error } = await supabase
            .from('profiles')
            .update(profileDataToUpdate)
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
            };
            setCurrentUser(updatedUser);
            setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
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
        messages,
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
        createMatch,
        sendMessage,
        getMessagesForMatch,
        updateUserProfile,
        addGoingIntention,
        removeGoingIntention,
        getCurrentGoingIntention,
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