import React from 'react';
import { useAppContext } from '../../context/AppContext';
import FeedPostCard from '../../components/FeedPostCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Newspaper, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OwnerFeedsPage: React.FC = () => {
    const { ownerFeedPosts, isLoading } = useAppContext();
    const navigate = useNavigate();

    if (isLoading) {
        return <LoadingSpinner message="Carregando suas postagens..." />;
    }

    return (
        <div className="p-4 relative h-full">
            {ownerFeedPosts.length === 0 ? (
                <div className="text-center text-text-secondary mt-16">
                    <Newspaper size={48} className="mx-auto text-primary mb-4" />
                    <p className="text-lg font-semibold">Nenhuma postagem encontrada.</p>
                    <p className="text-sm mt-2">Crie sua primeira postagem no feed para engajar com os clientes.</p>
                </div>
            ) : (
                <div className="pb-20">
                    {ownerFeedPosts.map(post => (
                        <FeedPostCard key={post.id} post={post} />
                    ))}
                </div>
            )}

            <button
                onClick={() => navigate('/owner/create-post')}
                className="absolute bottom-6 right-6 bg-accent text-white rounded-full p-4 shadow-lg hover:bg-pink-600 transition-colors z-20"
                aria-label="Criar nova postagem"
            >
                <Plus size={28} />
            </button>
        </div>
    );
};

export default OwnerFeedsPage;