import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Heart, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../components/LoadingSpinner';

const MatchPage: React.FC = () => {
    const { 
        currentUser, 
        userProfilesCache,
        matches,
        swipes,
        getCurrentCheckIn,
        getCurrentGoingIntention,
        getPlaceById, 
        checkIns,
        goingIntentions,
        fetchUsersForPlace
    } = useAppContext();
    
    const currentCheckIn = getCurrentCheckIn();
    const currentGoingIntention = getCurrentGoingIntention();

    const activePlaceId = currentCheckIn?.placeId || currentGoingIntention?.placeId;
    const activePlace = activePlaceId ? getPlaceById(activePlaceId) : null;
    
    const [swipedUserIds, setSwipedUserIds] = useState<Set<string>>(new Set());
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    useEffect(() => {
        if (activePlaceId) {
            setIsLoadingUsers(true);
            fetchUsersForPlace(activePlaceId).finally(() => setIsLoadingUsers(false));
        }
    }, [activePlaceId, fetchUsersForPlace]);

    const potentialMatches = useMemo(() => {
        if (!activePlaceId || !currentUser || !currentUser.matchPreferences) return [];

        const swipedUserIdsFromDB = new Set(swipes.map(s => s.swiped_id));

        const userIdsAtPlace = new Set([
            ...checkIns.filter(c => c.placeId === activePlaceId).map(c => c.userId),
            ...goingIntentions.filter(g => g.placeId === activePlaceId).map(g => g.userId)
        ]);

        const matchedUserIds = new Set(
            matches.flatMap(match => match.userIds).filter(id => id !== currentUser.id)
        );
        
        return Object.values(userProfilesCache).filter(otherUser => {
            if (otherUser.id === currentUser.id) return false;
            if (!otherUser.isAvailableForMatch || !otherUser.matchPreferences) return false;
            if (!userIdsAtPlace.has(otherUser.id)) return false;
            if (swipedUserIds.has(otherUser.id)) return false;
            if (swipedUserIdsFromDB.has(otherUser.id)) return false;
            if (matchedUserIds.has(otherUser.id)) return false;

            const currentUserPrefs = currentUser.matchPreferences;
            const otherUserPrefs = otherUser.matchPreferences;

            const otherUserMatchesMyPrefs = 
                currentUserPrefs.genders.includes(otherUser.gender) &&
                currentUserPrefs.sexualOrientations.includes(otherUser.sexualOrientation);

            const iMatchOtherUserPrefs = 
                otherUserPrefs.genders.includes(currentUser.gender) &&
                otherUserPrefs.sexualOrientations.includes(currentUser.sexualOrientation);

            if (!otherUserMatchesMyPrefs || !iMatchOtherUserPrefs) {
                return false;
            }

            return true;
        });
    }, [activePlaceId, currentUser, userProfilesCache, checkIns, goingIntentions, swipedUserIds, matches, swipes]);

    const [currentIndex, setCurrentIndex] = useState(0);
    
    useEffect(() => {
        setCurrentIndex(0);
    }, [activePlaceId]);


    const handleSwipe = async (liked: boolean) => {
        if (!currentUser || !potentialMatches[currentIndex]) return;

        const swipedUser = potentialMatches[currentIndex];
        
        const { error } = await supabase.from('swipes').insert({
            swiper_id: currentUser.id,
            swiped_id: swipedUser.id,
            liked: liked
        });

        if (error && error.code !== '23505') {
            console.error('Error saving swipe:', error);
        }

        setSwipedUserIds(prev => new Set(prev).add(swipedUser.id));
        setCurrentIndex(prev => prev + 1);
    };

    if (!activePlace) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <h2 className="text-2xl font-bold">Encontre Pessoas</h2>
                <p className="text-text-secondary mt-2 mb-4">Marque "Estou Aqui" ou "Eu Vou" em um local para ver quem mais está na vibe.</p>
                <Link to="/" className="bg-accent text-white font-bold py-2 px-6 rounded-lg">
                    Ver Locais
                </Link>
            </div>
        );
    }
    
    if (isLoadingUsers) {
        return <LoadingSpinner message={`Buscando pessoas em ${activePlace.name}...`} />;
    }

    if (potentialMatches.length === 0 || currentIndex >= potentialMatches.length) {
         return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <h2 className="text-2xl font-bold">Isso é tudo por enquanto!</h2>
                <p className="text-text-secondary mt-2">Você viu todas as pessoas que correspondem às suas preferências em "{activePlace.name}". Volte mais tarde!</p>
            </div>
        );
    }

    const user = potentialMatches[currentIndex];

    return (
        <div className="flex flex-col h-full p-4 overflow-hidden">
             <h2 className="text-center text-xl font-bold mb-2">Pessoas em {activePlace.name}</h2>
            <div className="flex-grow flex items-center justify-center">
                 <div className="relative w-full aspect-[3/4] max-w-sm">
                    <div className="relative w-full h-full bg-surface rounded-2xl shadow-2xl overflow-hidden">
                        <img src={user.photos[0]} alt={user.name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                            <h3 className="text-2xl font-bold">{user.name}, {user.age}</h3>
                            <p className="text-sm">{user.bio}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {user.interests.map(interest => (
                                    <span key={interest} className="text-xs bg-white/20 rounded-full px-2 py-1">{interest}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-center items-center space-x-8 py-4">
                <button onClick={() => handleSwipe(false)} className="bg-white/10 rounded-full p-4 text-red-400">
                    <X size={32} />
                </button>
                 <button onClick={() => handleSwipe(true)} className="bg-white/10 rounded-full p-5 text-green-400">
                    <Heart size={40} />
                </button>
            </div>
        </div>
    );
};

export default MatchPage;