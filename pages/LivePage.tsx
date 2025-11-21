import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import LivePostForm from '../components/LivePostForm';
import LivePostCard from '../components/LivePostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Radio } from 'lucide-react';

const LivePage: React.FC = () => {
    const { 
        getCurrentCheckIn, 
        getPlaceById, 
        livePosts, 
        fetchLivePosts, 
        createLivePost 
    } = useAppContext();
    
    const [isLoading, setIsLoading] = useState(true);
    const currentCheckIn = getCurrentCheckIn();
    const activePlace = currentCheckIn ? getPlaceById(currentCheckIn.placeId) : null;

    useEffect(() => {
        if (activePlace) {
            setIsLoading(true);
            fetchLivePosts(activePlace.id).finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [activePlace, fetchLivePosts]);

    if (!activePlace) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Radio size={48} className="text-primary mb-4" />
                <h2 className="text-2xl font-bold">Feed Ao Vivo</h2>
                <p className="text-text-secondary mt-2 mb-4">Faça check-in em um local para ver e compartilhar o que está acontecendo em tempo real.</p>
                <Link to="/" className="bg-accent text-white font-bold py-2 px-6 rounded-lg">
                    Ver Locais
                </Link>
            </div>
        );
    }

    const handlePostSubmit = async (content: string) => {
        if (activePlace) {
            await createLivePost(activePlace.id, content);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-1">Feed de {activePlace.name}</h2>
            <p className="text-text-secondary mb-4">Veja o que as pessoas estão dizendo agora.</p>
            
            <LivePostForm onSubmit={handlePostSubmit} />

            {isLoading ? (
                <LoadingSpinner message="Carregando feed..." />
            ) : (
                <div className="space-y-4">
                    {livePosts.length > 0 ? (
                        livePosts.map(post => <LivePostCard key={post.id} post={post} />)
                    ) : (
                        <p className="text-center text-text-secondary mt-8">Ninguém comentou ainda. Seja o primeiro!</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default LivePage;