import React, { useEffect, useState } from 'react';
import { Place } from '../../types';
import { useAppContext, LivePost } from '../../context/AppContext';
import LivePostForm from '../LivePostForm';
import LivePostCard from '../LivePostCard';
import LoadingSpinner from '../LoadingSpinner';
import { Clock, Radio } from 'lucide-react';

interface OwnerLiveFeedProps {
    place: Place;
}

const OwnerLiveFeed: React.FC<OwnerLiveFeedProps> = ({ place }) => {
    const { 
        ownedPlaceIds, // Usamos esta lista para verificar a permissão
        fetchLivePostsForPlace, 
        livePostsByPlace, 
        createLivePost 
    } = useAppContext();
    
    const [isLoading, setIsLoading] = useState(true);
    const posts = livePostsByPlace[place.id] || [];
    
    // Permissão de postagem para lojista: ele gerencia este local?
    const canOwnerPost = ownedPlaceIds.includes(place.id);

    useEffect(() => {
        setIsLoading(true);
        fetchLivePostsForPlace(place.id).finally(() => setIsLoading(false));
    }, [place.id, fetchLivePostsForPlace]);

    const handlePostSubmit = async (content: string) => {
        if (place) {
            await createLivePost(place.id, content);
        }
    };

    return (
        <div className="bg-surface p-4 rounded-lg shadow-lg mb-6">
            <h3 className="text-xl font-bold text-text-primary mb-3 flex items-center">
                <Radio size={20} className="mr-2 text-accent" />
                {place.name}
            </h3>

            {canOwnerPost ? (
                <div className="mb-4">
                    <div className="flex items-center text-sm text-text-secondary mb-2 p-2 bg-gray-800 rounded-lg">
                        <Clock size={16} className="mr-2 text-accent" />
                        <span>Poste um comentário como representante do estabelecimento.</span>
                    </div>
                    <LivePostForm onSubmit={handlePostSubmit} />
                </div>
            ) : (
                <p className="text-sm text-text-secondary mb-4">
                    Você está visualizando o feed ao vivo de um local que não gerencia.
                </p>
            )}

            <div className="space-y-4">
                {isLoading ? (
                    <LoadingSpinner message="Carregando posts ao vivo..." />
                ) : posts.length > 0 ? (
                    posts.map(post => <LivePostCard key={post.id} post={post} />)
                ) : (
                    <p className="text-center text-text-secondary">Nenhum post ao vivo neste local.</p>
                )}
            </div>
        </div>
    );
};

export default OwnerLiveFeed;