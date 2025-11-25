import React from 'react';
import FeedPostCard from '../components/FeedPostCard';
import { useAppContext } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { Newspaper } from 'lucide-react';

const FeedsPage: React.FC = () => {
    const { allFeedPosts, isLoading } = useAppContext();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="p-4">
            {allFeedPosts.length > 0 ? (
                allFeedPosts.map(post => (
                    <FeedPostCard key={post.id} post={post} />
                ))
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary mt-16">
                    <Newspaper size={64} className="text-primary mb-4" />
                    <h2 className="text-2xl font-semibold text-text-primary">Feed Vazio por Enquanto</h2>
                    <p className="mt-2">Nenhuma postagem foi feita na última hora. Fique de olho para ver as novidades dos seus locais favoritos!</p>
                </div>
            )}
        </div>
    );
};

export default FeedsPage;