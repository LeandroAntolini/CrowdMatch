import React from 'react';
import { mockFeedData } from '../data/mockFeedData';
import FeedPostCard from '../components/FeedPostCard';
import { useAppContext } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';

const FeedsPage: React.FC = () => {
    const { ownerFeedPosts, isLoading } = useAppContext(); // Usando ownerFeedPosts como fonte de dados por enquanto

    if (isLoading) {
        return <LoadingSpinner />;
    }

    // TODO: No futuro, esta página deve buscar um feed agregado de todos os lugares,
    // mas por agora, vamos exibir os posts existentes para demonstração.
    const postsToDisplay = ownerFeedPosts.length > 0 ? ownerFeedPosts : mockFeedData;

    return (
        <div className="p-4">
            {postsToDisplay.map(post => (
                <FeedPostCard key={post.id} post={post} />
            ))}
        </div>
    );
};

export default FeedsPage;