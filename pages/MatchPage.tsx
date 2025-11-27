import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Heart, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../components/LoadingSpinner';

const MatchPage: React.FC = () => {
    const { 
        currentUser, 
        getCurrentCheckIn,
        getCurrentGoingIntention,
        getPlaceById, 
        potentialMatches,
        fetchPotentialMatches
    } = useAppContext();
    
    const currentCheckIn = getCurrentCheckIn();
    const currentGoingIntention = getCurrentGoingIntention();

    const activePlaceId = currentCheckIn?.placeId || currentGoingIntention?.placeId;
    const activePlace = activePlaceId ? getPlaceById(activePlaceId) : null;
    
    const [isLoading, setIsLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (activePlaceId) {
            setIsLoading(true);
            setCurrentIndex(0);
            fetchPotentialMatches(activePlaceId).finally(() => setIsLoading(false));
        }
    }, [activePlaceId, fetchPotentialMatches]);

    const handleSwipe = async (liked: boolean) => {
        if (!currentUser || !potentialMatches[currentIndex]) return;

        const swipedUser = potentialMatches[currentIndex];
        
        // Atualização otimista da UI
        setCurrentIndex(prev => prev + 1);
        
        const { error } = await supabase.from('swipes').insert({
            swiper_id: currentUser.id,
            swiped_id: swipedUser.id,
            liked: liked
        });

        if (error && error.code !== '23505') { // Ignora erro de duplicata
            console.error('Error saving swipe:', error);
            // Opcional: reverter a UI em caso de erro
            setCurrentIndex(prev => prev - 1);
        }
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
    
    if (isLoading) {
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