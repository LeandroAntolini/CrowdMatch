import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Heart, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const MatchPage: React.FC = () => {
    const { 
        currentUser, 
        users, 
        getCurrentCheckIn,
        getCurrentGoingIntention,
        getPlaceById, 
        createMatch,
        checkIns,
        goingIntentions
    } = useAppContext();
    
    const currentCheckIn = getCurrentCheckIn();
    const currentGoingIntention = getCurrentGoingIntention();

    const activePlaceId = currentCheckIn?.placeId || currentGoingIntention?.placeId;
    const activePlace = activePlaceId ? getPlaceById(activePlaceId) : null;
    
    const potentialMatches = useMemo(() => {
        if (!activePlaceId || !currentUser) return [];

        const userIdsAtPlace = new Set([
            ...checkIns.filter(c => c.placeId === activePlaceId).map(c => c.userId),
            ...goingIntentions.filter(g => g.placeId === activePlaceId).map(g => g.userId)
        ]);
        
        return users.filter(otherUser => {
            if (otherUser.id === currentUser.id) return false;
            if (!otherUser.isAvailableForMatch) return false;
            if (!userIdsAtPlace.has(otherUser.id)) return false;

            const myPrefs = currentUser.matchPreferences;
            const otherUserPrefs = otherUser.matchPreferences;
            
            const iAmInterested = 
                myPrefs.genders.includes(otherUser.gender) &&
                myPrefs.sexualOrientations.includes(otherUser.sexualOrientation);
            
            if (!iAmInterested) return false;

            const theyAreInterested =
                otherUserPrefs.genders.includes(currentUser.gender) &&
                otherUserPrefs.sexualOrientations.includes(currentUser.sexualOrientation);

            return theyAreInterested;
        });
    }, [activePlaceId, currentUser, users, checkIns, goingIntentions]);

    const [currentIndex, setCurrentIndex] = useState(0);
    
    useEffect(() => {
        setCurrentIndex(0);
    }, [activePlaceId]);


    const handleSwipe = async (liked: boolean) => {
        if (liked && potentialMatches[currentIndex]) {
            await createMatch(potentialMatches[currentIndex].id);
            alert(`Você deu match com ${potentialMatches[currentIndex].name}!`);
        }
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
             <h2 className="text-center text-xl font-bold mb-2">Pessoas para {activePlace.name}</h2>
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