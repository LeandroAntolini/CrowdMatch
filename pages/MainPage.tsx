import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Place } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, CalendarClock, ChevronDown, MapPin, Search } from 'lucide-react';
import { citiesByState } from '../data/locations';

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
                    <p className="text-sm text-text-secondary">{place.category} &bull; {place.city}</p>
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
    const { places, checkIns, goingIntentions, isLoading, error, currentUser, fetchPlaces } = useAppContext();
    
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [selectedCrowdLevel, setSelectedCrowdLevel] = useState<string>('Todos');
    const [selectedLocation, setSelectedLocation] = useState<string>(currentUser?.city || '');
    
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isCrowdLevelOpen, setIsCrowdLevelOpen] = useState(false);
    const [isLocationOpen, setIsLocationOpen] = useState(false);

    const categoryRef = useRef<HTMLDivElement>(null);
    const crowdLevelRef = useRef<HTMLDivElement>(null);
    const locationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentUser?.city && !selectedLocation) {
            setSelectedLocation(currentUser.city);
        }
    }, [currentUser?.city, selectedLocation]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) setIsCategoryOpen(false);
            if (crowdLevelRef.current && !crowdLevelRef.current.contains(event.target as Node)) setIsCrowdLevelOpen(false);
            if (locationRef.current && !locationRef.current.contains(event.target as Node)) setIsLocationOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getCrowdCount = (placeId: string) => checkIns.filter(ci => ci.placeId === placeId).length;
    const getGoingCount = (placeId: string) => goingIntentions.filter(gi => gi.placeId === placeId).length;

    const categories = useMemo(() => ['Todos', ...new Set(places.map(p => p.category))], [places]);
    const crowdLevels = ['Todos', 'Tranquilo', 'Moderado', 'Agitado'];
    
    const locations = useMemo(() => {
        if (currentUser?.state && citiesByState[currentUser.state]) {
            return citiesByState[currentUser.state];
        }
        return currentUser?.city ? [currentUser.city] : [];
    }, [currentUser?.state, currentUser?.city]);

    const filteredPlaces = useMemo(() => {
        return places
            .filter(place => {
                const searchMatch = place.name.toLowerCase().includes(searchQuery.toLowerCase());
                if (!searchMatch) return false;

                const categoryMatch = selectedCategory === 'Todos' || place.category === selectedCategory;
                if (!categoryMatch) return false;

                if (selectedCrowdLevel !== 'Todos') {
                    const crowdCount = getCrowdCount(place.id);
                    const crowdLevelText = getCrowdLevelText(crowdCount);
                    if (crowdLevelText !== selectedCrowdLevel) return false;
                }
                
                return true;
            })
            .sort((a, b) => {
                const crowdCountB = getCrowdCount(b.id);
                const crowdCountA = getCrowdCount(a.id);

                if (crowdCountB !== crowdCountA) {
                    return crowdCountB - crowdCountA; // Ordena por check-ins (descendente)
                }

                // Se os check-ins forem iguais, ordena por intenções de ir (descendente)
                const goingCountB = getGoingCount(b.id);
                const goingCountA = getGoingCount(a.id);
                return goingCountB - goingCountA;
            });
    }, [places, searchQuery, selectedCategory, selectedCrowdLevel, checkIns, goingIntentions]);

    if (isLoading) {
        return <LoadingSpinner message="Buscando locais..." />;
    }

    if (error) {
        return <div className="p-4 text-center text-red-400">{error}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-4">Locais</h1>

            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder="Buscar pelo nome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface px-4 py-2 pl-10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
                {/* Category Filter */}
                <div className="relative" ref={categoryRef}>
                    <button onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full flex items-center justify-between bg-surface px-3 py-2 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent">
                        <span className="truncate">{selectedCategory}</span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isCategoryOpen && (
                        <ul className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto no-scrollbar">
                            {categories.map(category => (
                                <li key={category} onClick={() => { setSelectedCategory(category); setIsCategoryOpen(false); }} className="px-4 py-2 hover:bg-accent hover:text-white cursor-pointer">
                                    {category}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Crowd Level Filter */}
                <div className="relative" ref={crowdLevelRef}>
                    <button onClick={() => setIsCrowdLevelOpen(!isCrowdLevelOpen)} className="w-full flex items-center justify-between bg-surface px-3 py-2 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent">
                        <span className="truncate">{selectedCrowdLevel}</span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isCrowdLevelOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isCrowdLevelOpen && (
                        <ul className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto no-scrollbar">
                            {crowdLevels.map(level => (
                                <li key={level} onClick={() => { setSelectedCrowdLevel(level); setIsCrowdLevelOpen(false); }} className="px-4 py-2 hover:bg-accent hover:text-white cursor-pointer">
                                    {level}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Location Filter */}
                <div className="relative" ref={locationRef}>
                    <button onClick={() => setIsLocationOpen(!isLocationOpen)} className="w-full flex items-center justify-between bg-surface px-3 py-2 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent">
                        <MapPin size={14} className="mr-1 text-text-secondary" />
                        <span className="truncate">{selectedLocation || 'Selecione'}</span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isLocationOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isLocationOpen && (
                        <ul className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto no-scrollbar">
                            {locations.map(loc => (
                                <li key={loc} onClick={() => { 
                                    setSelectedLocation(loc); 
                                    setIsLocationOpen(false); 
                                    if (currentUser?.state) {
                                        fetchPlaces(loc, currentUser.state);
                                    }
                                }} className="px-4 py-2 hover:bg-accent hover:text-white cursor-pointer">
                                    {loc}
                                </li>
                            ))}
                        </ul>
                    )}
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
                    <div className="text-center text-text-secondary mt-8">
                        <p>Nenhum local encontrado para "{selectedLocation}" com os filtros aplicados.</p>
                        <p className="text-sm">Tente ajustar sua busca ou filtros.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainPage;