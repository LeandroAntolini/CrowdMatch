import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Place } from '../types';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Users, CalendarClock } from 'lucide-react';

const getCrowdCount = (placeId: string, checkIns: any[]) => (checkIns || []).filter(ci => ci.placeId === placeId).length;
const getGoingCount = (placeId: string, goingIntentions: any[]) => (goingIntentions || []).filter(gi => gi.placeId === placeId).length;

const FavoritePlaceCard: React.FC<{ place: Place; crowdCount: number; goingCount: number }> = ({ place, crowdCount, goingCount }) => {
    return (
        <Link to={`/place/${place.id}`} className="block bg-surface rounded-lg p-4 mb-4 shadow-md hover:bg-gray-700 transition-all duration-200">
            <div className="flex items-center space-x-4">
                <img src={place.photoUrl} alt={place.name} className="w-20 h-20 rounded-md object-cover" />
                <div className="flex-grow">
                    <h3 className="font-bold text-lg text-text-primary">{place.name}</h3>
                    <p className="text-sm text-text-secondary flex items-center">
                        <MapPin size={14} className="mr-1 text-text-secondary" />
                        {place.city} &bull; {place.category}
                    </p>
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

const FavoritePlacesList: React.FC = () => {
    const { favorites, places, checkIns, goingIntentions } = useAppContext();

    const favoritePlaces = useMemo(() => {
        const favoritePlaceIds = new Set(favorites.map(f => f.placeId));
        return places.filter(place => favoritePlaceIds.has(place.id));
    }, [favorites, places]);

    if (favoritePlaces.length === 0) {
        return (
            <div className="text-center text-text-secondary mt-8 p-4">
                <Heart size={48} className="mx-auto text-primary mb-4" />
                <p className="text-lg font-semibold">Nenhum favorito encontrado.</p>
                <p className="text-sm mt-2">Adicione locais aos seus favoritos na página de detalhes para vê-los aqui.</p>
            </div>
        );
    }

    return (
        <div className="mt-4">
            {favoritePlaces.map(place => (
                <FavoritePlaceCard 
                    key={place.id} 
                    place={place} 
                    crowdCount={getCrowdCount(place.id, checkIns)}
                    goingCount={getGoingCount(place.id, goingIntentions)}
                />
            ))}
        </div>
    );
};

export default FavoritePlacesList;