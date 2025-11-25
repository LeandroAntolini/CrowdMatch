import React from 'react';
import FeedPostCard from '../components/FeedPostCard';
import { useAppContext } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { Newspaper, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeedsPage: React.FC = () => {
    const { allFeedPosts, isLoading } = useAppContext();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="p-4">
            {allFeedPosts.length > 0 ? (
                <div className="space-y-6">
                    {allFeedPosts.map(post => (
                        <FeedPostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary mt-16">
                    <Newspaper size={64} className="text-primary mb-4" />
                    <h2 className="text-2xl font-semibold text-text-primary">O feed está tranquilo agora</h2>
                    <p className="mt-2 max-w-md">
                        Nenhuma postagem foi feita na última hora. Explore a aba 'Locais' para descobrir estabelecimentos e ver o que está acontecendo perto de você!
                    </p>
                    <Link to="/places" className="mt-6 bg-accent text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center">
                        <Search size={18} className="mr-2" />
                        Explorar Locais
                    </Link>
                </div>
            )}
        </div>
    );
};

export default FeedsPage;