import React from 'react';
import { useAppContext } from '../../context/AppContext';
import FeedPostCard from '../../components/FeedPostCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Newspaper } from 'lucide-react';

const OwnerFeedsPage: React.FC = () => {
    const { ownerFeedPosts, isLoading } = useAppContext();

    if (isLoading) {
        return <LoadingSpinner message="Carregando suas postagens..." />;
    }

    return (
        <div className="p-4">
            {ownerFeedPosts.length === 0 ? (
                <div className="text-center text-text-secondary mt-16">
                    <Newspaper size={48} className="mx-auto text-primary mb-4" />
                    <p className="text-lg font-semibold">Nenhuma postagem encontrada.</p>
                    <p className="text-sm mt-2">Crie sua primeira postagem no feed para engajar com os clientes.</p>
                </div>
            ) : (
                ownerFeedPosts.map(post => (
                    <FeedPostCard key={post.id} post={post} />
                ))
            )}
        </div>
    );
};

export default OwnerFeedsPage;