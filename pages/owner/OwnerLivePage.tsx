import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Radio, Globe, Building } from 'lucide-react';
import OwnerLiveFeed from '../../components/owner/OwnerLiveFeed';
import { Place } from '../../types';

const OwnerLivePage: React.FC = () => {
    const { 
        ownedPlaceIds, 
        getPlaceById, 
        places, 
        isLoading,
        activeLivePosts
    } = useAppContext();
    
    const [viewMode, setViewMode] = useState<'owned' | 'all'>('owned');

    const ownedPlacesDetails = useMemo(() => {
        return ownedPlaceIds
            .map(id => getPlaceById(id))
            .filter((p): p is Place => p !== undefined);
    }, [ownedPlaceIds, getPlaceById]);

    const allActivePlaces = useMemo(() => {
        const activePlaceIds = new Set(activeLivePosts.map(p => p.place_id));
        return places
            .filter(place => activePlaceIds.has(place.id))
            .sort((a, b) => {
                const countA = activeLivePosts.filter(p => p.place_id === a.id).length;
                const countB = activeLivePosts.filter(p => p.place_id === b.id).length;
                return countB - countA;
            });
    }, [activeLivePosts, places]);

    const placesToDisplay = viewMode === 'owned' ? ownedPlacesDetails : allActivePlaces;
    
    const activeTabClass = 'bg-accent text-white';
    const inactiveTabClass = 'text-text-secondary hover:bg-gray-700';

    if (isLoading) {
        return <LoadingSpinner message="Carregando dados do local..." />;
    }

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-4 flex items-center">
                <Radio size={28} className="mr-2 text-primary" />
                Feed Ao Vivo
            </h1>

            <div className="flex justify-center mb-6 rounded-lg bg-gray-800 p-1">
                <button
                    onClick={() => setViewMode('owned')}
                    className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors flex items-center justify-center ${viewMode === 'owned' ? activeTabClass : inactiveTabClass}`}
                >
                    <Building size={18} className="mr-2" />
                    Meus Locais
                </button>
                <button
                    onClick={() => setViewMode('all')}
                    className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors flex items-center justify-center ${viewMode === 'all' ? activeTabClass : inactiveTabClass}`}
                >
                    <Globe size={18} className="mr-2" />
                    Todos os Locais
                </button>
            </div>

            {viewMode === 'owned' && ownedPlacesDetails.length === 0 && (
                <div className="text-center text-text-secondary mt-8">
                    <p className="text-lg font-semibold">Nenhum local gerenciado.</p>
                    <p className="text-sm mt-2">Adicione locais ao seu perfil para monitorar o feed ao vivo.</p>
                </div>
            )}
            
            {placesToDisplay.length === 0 && viewMode === 'all' && (
                <div className="text-center text-text-secondary mt-8">
                    <p className="text-lg font-semibold">Nenhum local com atividade ao vivo.</p>
                    <p className="text-sm mt-2">Volte mais tarde para ver o que está rolando.</p>
                </div>
            )}

            <div className="space-y-6">
                {placesToDisplay.map(place => (
                    <OwnerLiveFeed key={place.id} place={place} />
                ))}
            </div>
        </div>
    );
};

export default OwnerLivePage;