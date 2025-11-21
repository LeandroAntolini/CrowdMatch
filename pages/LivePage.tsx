import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import LivePostForm from '../components/LivePostForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, Radio } from 'lucide-react';
import { Place } from '../types';
import LiveFeedBox from '../components/LiveFeedBox';

const LivePage: React.FC = () => {
    const { 
        places,
        currentUser,
        getCurrentCheckIn,
        getPlaceById,
        createLivePost,
        fetchPlaces,
        isLoading,
        activeLivePosts
    } = useAppContext();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [searchedPlaces, setSearchedPlaces] = useState<Place[] | null>(null);

    const currentCheckIn = getCurrentCheckIn();
    const checkedInPlace = currentCheckIn ? getPlaceById(currentCheckIn.placeId) : null;

    const topPlaces = useMemo(() => {
        if (searchedPlaces) return searchedPlaces;

        const placeCounts = activeLivePosts.reduce((acc, post) => {
            acc[post.place_id] = (acc[post.place_id] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        return places
            .map(place => ({ ...place, count: placeCounts[place.id] || 0 }))
            .filter(place => place.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
    }, [activeLivePosts, places, searchedPlaces]);

    const handleSearch = async () => {
        if (!searchQuery.trim() || !currentUser?.city || !currentUser?.state) return;
        const results = await fetchPlaces(currentUser.city, currentUser.state, searchQuery.trim());
        setSearchedPlaces(results);
    };

    const handlePostSubmit = async (content: string) => {
        if (checkedInPlace) {
            await createLivePost(checkedInPlace.id, content);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Feed Ao Vivo</h1>
                <p className="text-text-secondary">Veja o que está rolando nos locais mais quentes.</p>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar um local específico..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-surface px-4 py-2 pl-10 pr-12 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button 
                    onClick={handleSearch}
                    className="absolute right-0 top-0 bottom-0 px-3 flex items-center text-text-secondary hover:text-accent"
                    aria-label="Buscar local"
                >
                    <Search size={20} />
                </button>
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            </div>

            {checkedInPlace && (
                <div>
                    <h2 className="text-lg font-semibold mb-2">Postar em {checkedInPlace.name}</h2>
                    <LivePostForm onSubmit={handlePostSubmit} />
                </div>
            )}

            {isLoading && !topPlaces.length ? (
                <LoadingSpinner />
            ) : topPlaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {topPlaces.map(place => (
                        <LiveFeedBox key={place.id} place={place} />
                    ))}
                </div>
            ) : (
                <div className="text-center text-text-secondary mt-8 p-4">
                    <Radio size={48} className="mx-auto text-primary mb-4" />
                    <p className="text-lg font-semibold">Nenhum feed ao vivo disponível.</p>
                    <p className="text-sm mt-2">Parece que os locais estão tranquilos agora. Tente buscar por um local específico ou volte mais tarde!</p>
                </div>
            )}
        </div>
    );
};

export default LivePage;