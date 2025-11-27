import React from 'react';
import { Link } from 'react-router-dom';
import { Place } from '../types';
import { useAppContext, LivePost } from '../context/AppContext';
import ScrollingComment from './ScrollingComment';
import LoadingSpinner from './LoadingSpinner';
import { ChevronRight } from 'lucide-react';

interface LiveFeedBoxProps {
    place: Place;
    showPlaceHeader?: boolean;
}

const LiveFeedBox: React.FC<LiveFeedBoxProps> = ({ place, showPlaceHeader = true }) => {
    const { livePostsByPlace, fetchLivePostsForPlace } = useAppContext();
    const [isLoading, setIsLoading] = React.useState(true);
    const posts = livePostsByPlace[place.id] || [];
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setIsLoading(true);
        fetchLivePostsForPlace(place.id).finally(() => setIsLoading(false));
    }, [place.id, fetchLivePostsForPlace]);

    React.useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || posts.length < 3) return;

        let scrollInterval: number;

        const startScrolling = () => {
            scrollInterval = window.setInterval(() => {
                if (container.scrollTop >= container.scrollHeight - container.clientHeight - 1) {
                    container.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    container.scrollTop += 1;
                }
            }, 50);
        };

        const stopScrolling = () => clearInterval(scrollInterval);

        container.addEventListener('mouseenter', stopScrolling);
        container.addEventListener('mouseleave', startScrolling);
        
        startScrolling();

        return () => {
            stopScrolling();
            container.removeEventListener('mouseenter', stopScrolling);
            container.removeEventListener('mouseleave', startScrolling);
        };
    }, [posts.length]);

    return (
        <div className="bg-surface rounded-lg flex flex-col h-80">
            {showPlaceHeader && (
                <Link to={`/place/${place.id}`} className="p-3 border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-text-primary truncate">{place.name}</h3>
                            <p className="text-sm text-text-secondary">{place.category}</p>
                        </div>
                        <ChevronRight size={20} className="text-text-secondary" />
                    </div>
                </Link>
            )}
            <div ref={scrollContainerRef} className="flex-grow overflow-y-auto no-scrollbar">
                {isLoading ? (
                    <LoadingSpinner message="Carregando..." />
                ) : posts.length > 0 ? (
                    posts.map(post => <ScrollingComment key={post.id} post={post} />)
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-text-secondary">Nenhum post ainda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveFeedBox;