
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, Place, CheckIn, Match, Message, GoingIntention, GENDERS, SEXUAL_ORIENTATIONS } from '../types';
import { generateMockPlaces, generateMockUsers } from '../services/mockDataService';

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
    login: (email: string, gender: string, sexualOrientation: string) => void;
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
    updateUserProfile: (updatedUser: User) => void;
    addGoingIntention: (placeId: string) => void;
    removeGoingIntention: () => void;
    getCurrentGoingIntention: () => GoingIntention | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const FAKE_USER_ID = 'user_0';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => localStorage.getItem('onboarded') === 'true');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [places, setPlaces] = useState<Place[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [goingIntentions, setGoingIntentions] = useState<GoingIntention[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const initializeData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const mockUsers = await generateMockUsers(15);
            const mockPlaces = await generateMockPlaces();
            
            setUsers(mockUsers);
            setPlaces(mockPlaces);
            
            const mainUser = mockUsers.find(u => u.id === FAKE_USER_ID);
            if(mainUser) {
                // Set default user as not logged in
                setCurrentUser(mainUser);
            }

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


        } catch (e) {
            console.error("Failed to initialize data:", e);
            setError("Não foi possível carregar os dados do app. Verifique sua chave de API do Gemini e atualize a página.");
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        initializeData();
    }, [initializeData]);

    const login = (email: string, gender: string, sexualOrientation: string) => {
        if (currentUser) {
            const updatedUser: User = {
              ...currentUser,
              email,
              gender,
              sexualOrientation,
              // Set default preferences on first login/signup
              matchPreferences: {
                genders: GENDERS.filter(g => g !== 'Outro'),
                sexualOrientations: SEXUAL_ORIENTATIONS.filter(s => s !== 'Outro'),
              }
            };
            setCurrentUser(updatedUser);
            // Also update the user in the main list
            setUsers(prevUsers => prevUsers.map(u => u.id === FAKE_USER_ID ? updatedUser : u));
            setIsAuthenticated(true);
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
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
    const getUserById = (id: string) => users.find(u => u.id === id);

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

    const updateUserProfile = (updatedUser: User) => {
        if(!currentUser || currentUser.id !== updatedUser.id) return;
        setCurrentUser(updatedUser);
        setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const value = {
        isAuthenticated,
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
        login,
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
