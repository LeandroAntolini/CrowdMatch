
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Place } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, CalendarClock } from 'lucide-react';

const getCrowdLevelText = (count: number): 'Tranquilo' | 'Moderado' | 'Agitado' => {
    if (count < 2) return 'Tranquilo';
    if (count < 5) return 'Moderado';
    return 'Agitado';
};

const PlaceCard: React.FC<{ place: Place; crowdCount: number; goingCount: number }> = ({ place, crowdCount, goingCount }) => {
    return (
        <Link to={`/place/${place.id}`} className="block bg-surface rounded-lg p-4 mb-4 shadow-md hover:bg-gray-700 transition-all duration-200">
            <div className="flex items-center space-x-4">
                <img src={place.photoUrl} alt={place.name} className="w-20 h-20 rounded-md object-cover" />
                <div className="flex-grow">
                    <h3 className="font-bold text-lg text-text-primary">{place.name}</h3>
                    <p className="text-sm text-text-secondary">{place.category} &bull; a {place.distance}m</p>
                    <div className="flex items-center text-sm mt-2 space-x-4">
                        <div className="flex items-center text-text-secondary">
                            <Users size={16} className="mr-1 text-primary" />
                            <span>{crowdCount} aqui</span>
                        </div>
                         <div className="flex items-center text-text-secondary">
                            <CalendarClock size={16} className="mr-1 text-accent" />
                            <span className="font-semibold">{goingCount} vão</span>
                        </div>
                    </div>
                </div>
                 <div className={`px-3 py-1 text-xs font-semibold rounded-full ${place.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {place.isOpen ? "Aberto" : "Fechado"}
                </div>
            </div>
        </Link>
    );
};


const MainPage: React.FC = () => {
    const { places, checkIns, goingIntentions, isLoading, error } = useAppContext();
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [selectedCrowdLevel, setSelectedCrowdLevel] = useState<string>('Todos');

    const getCrowdCount = (placeId: string) => {
        return checkIns.filter(ci => ci.placeId === placeId).length;
    };
    
    const getGoingCount = (placeId: string) => {
        return goingIntentions.filter(gi => gi.placeId === placeId).length;
    };

    const categories = useMemo(() => ['Todos', ...new Set(places.map(p => p.category))], [places]);
    const crowdLevels = ['Todos', 'Tranquilo', 'Moderado', 'Agitado'];

    const filteredPlaces = useMemo(() => {
        return places.filter(place => {
            const categoryMatch = selectedCategory === 'Todos' || place.category === selectedCategory;
            if (!categoryMatch) return false;

            if (selectedCrowdLevel !== 'Todos') {
                const crowdCount = getCrowdCount(place.id);
                const crowdLevelText = getCrowdLevelText(crowdCount);
                if (crowdLevelText !== selectedCrowdLevel) return false;
            }
            
            return true;
        });
    }, [places, selectedCategory, selectedCrowdLevel, checkIns]);

    if (isLoading) {
        return <LoadingSpinner message="Gerando locais próximos com o Gemini..." />;
    }

    if (error) {
        return <div className="p-4 text-center text-red-400">{error}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-4">Locais Próximos</h1>
            
            <div className="space-y-4 mb-6">
                <div>
                    <h2 className="text-sm font-semibold text-text-secondary mb-2">Categoria</h2>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(category => (
                             <button 
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedCategory === category ? 'bg-accent text-white font-semibold' : 'bg-surface hover:bg-gray-700'}`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <h2 className="text-sm font-semibold text-text-secondary mb-2">Nível de Lotação (Aqui)</h2>
                    <div className="flex flex-wrap gap-2">
                        {crowdLevels.map(level => (
                             <button 
                                key={level}
                                onClick={() => setSelectedCrowdLevel(level)}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedCrowdLevel === level ? 'bg-accent text-white font-semibold' : 'bg-surface hover:bg-gray-700'}`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                {filteredPlaces.length > 0 ? (
                     filteredPlaces.map(place => (
                        <PlaceCard 
                          key={place.id} 
                          place={place} 
                          crowdCount={getCrowdCount(place.id)}
                          goingCount={getGoingCount(place.id)}
                        />
                    ))
                ) : (
                    <p className="text-center text-text-secondary mt-8">Nenhum local corresponde aos seus filtros.</p>
                )}
            </div>
        </div>
    );
};

export default MainPage;
