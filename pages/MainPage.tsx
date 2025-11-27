import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Place } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, CalendarClock, ChevronDown, MapPin, Search, Heart, Map, Radio, Ticket } from 'lucide-react';
import { citiesByState } from '../data/locations';
import FavoritePlacesList from '../components/FavoritePlacesList';
import MapModal from '../components/MapModal';
import PinnedPlaceCard from '../components/PinnedPlaceCard';

const getCrowdLevelText = (count: number): 'Tranquilo' | 'Moderado' | 'Agitado' => {
    if (count < 2) return 'Tranquilo';
    if (count < 5) return 'Moderado';
    return 'Agitado';
};

const PlaceCard: React.FC<{ place: Place; crowdCount: number; goingCount: number; livePostCount: number; hasActivePromotion: boolean }> = ({ place, crowdCount, goingCount, livePostCount, hasActivePromotion }) => {
    const promotionClass = hasActivePromotion ? 'bg-yellow-400/20 text-yellow-400' : 'bg-gray-600/50 text-gray-500';

    return (
        <Link to={`/place/${place.id}`} className="block bg-surface rounded-lg p-4 mb-4 shadow-md hover:bg-gray-700 transition-all duration-200">
            <div className="flex items-center space-x-4">
                <img src={place.photoUrl} alt={place.name} className="w-20 h-20 rounded-md object-cover" />
                <div className="flex-grow">
                    <h3 className="font-bold text-lg text-text-primary">{place.name}</h3>
                    <p className="text-sm text-text-secondary">{place.category} &bull; {place.city}</p>
                    <div className="flex items-center flex-wrap gap-2 mt-3">
                        <div className="flex items-center text-xs bg-primary/20 text-primary font-semibold px-2 py-1 rounded-full">
                            <Users size={14} className="mr-1.5" />
                            <span>{crowdCount} aqui</span>
                        </div>
                        <div className="flex items-center text-xs bg-accent/20 text-accent font-semibold px-2 py-1 rounded-full">
                            <CalendarClock size={14} className="mr-1.5" />
                            <span>{goingCount} vão</span>
                        </div>
                        <div className="flex items-center text-xs bg-blue-400/20 text-blue-400 font-semibold px-2 py-1 rounded-full">
                            <Radio size={14} className="mr-1.5" />
                            <span>{livePostCount} vivo</span>
                        </div>
                        <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${promotionClass}`}>
                            <Ticket size={14} className="mr-1.5" />
                            <span>Promoção</span>
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
    const { 
        places, 
        checkIns, 
        goingIntentions, 
        isLoading: isContextLoading, // Renomeado para evitar conflito
        error, 
        currentUser, 
        fetchPlaces, 
        searchPlaces, // Usaremos este para buscas manuais
        getLivePostCount, 
        getActivePromotionsForPlace,
        getCurrentCheckIn,
        getPlaceById,
        checkOutUser,
        removeGoingIntention
    } = useAppContext();
    
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [selectedCrowdLevel, setSelectedCrowdLevel] = useState<string>('Todos');
    const [selectedLocation, setSelectedLocation] = useState<string>(currentUser?.city || '');
    const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [isLocalLoading, setIsLocalLoading] = useState(false); // Novo estado para carregamento local

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

    const getCrowdCount = (placeId: string) => (checkIns || []).filter(ci => ci.placeId === placeId).length;
    const getGoingCount = (placeId: string) => (goingIntentions || []).filter(gi => gi.placeId === placeId).length;

    const categories = useMemo(() => {
        // Filtra as categorias apenas dos locais na cidade selecionada
        const placesInSelectedCity = places.filter(p => p.city === selectedLocation);
        if (placesInSelectedCity.length === 0) return ['Todos'];
        const uniqueCategories = new Set(placesInSelectedCity.map(place => place.category));
        return ['Todos', ...Array.from(uniqueCategories).sort()];
    }, [places, selectedLocation]);
    
    const crowdLevels = ['Todos', 'Tranquilo', 'Moderado', 'Agitado'];
    
    const locations = useMemo(() => {
        if (currentUser?.state && citiesByState[currentUser.state]) {
            return citiesByState[currentUser.state];
        }
        return currentUser?.city ? [currentUser.city] : [];
    }, [currentUser?.state, currentUser?.city]);

    const handleRemoteSearch = async () => {
        if (!currentUser?.state || !selectedLocation) return;
        
        setIsLocalLoading(true);
        try {
            // searchPlaces agora não manipula o isLoading global
            await searchPlaces(selectedLocation, currentUser.state, searchQuery.trim());
            setSelectedCategory('Todos');
            setSelectedCrowdLevel('Todos');
            setViewMode('all');
        } catch (e) {
            // Erro já é tratado no contexto, mas podemos logar aqui
            console.error("Erro na busca remota:", e);
        } finally {
            setIsLocalLoading(false);
        }
    };

    const handleLocationChange = async (newLocation: string) => {
        if (!currentUser?.state) return;
        
        setSelectedLocation(newLocation);
        setIsLocalLoading(true);
        
        try {
            // fetchPlaces usa cache. Se for um novo local, ele fará a chamada lenta.
            await fetchPlaces(newLocation, currentUser.state);
        } catch (e) {
            console.error("Erro ao carregar locais por cidade:", e);
        } finally {
            setIsLocalLoading(false);
        }
    };

    // --- Lógica de Separação de Locais ---
    const currentCheckIn = getCurrentCheckIn();
    const checkedInPlace = currentCheckIn ? getPlaceById(currentCheckIn.placeId) : null;

    const goingToPlaceIds = useMemo(() => 
        new Set(goingIntentions.filter(gi => gi.userId === currentUser?.id).map(gi => gi.placeId)),
        [goingIntentions, currentUser]
    );
    const goingToPlaces = useMemo(() => 
        places.filter(p => goingToPlaceIds.has(p.id)),
        [places, goingToPlaceIds]
    );

    const otherPlaces = useMemo(() => {
        return places
            .filter(place => {
                if (checkedInPlace && place.id === checkedInPlace.id) return false;
                if (goingToPlaceIds.has(place.id)) return false;

                // Filtro principal: Apenas locais na cidade selecionada
                if (selectedLocation && place.city !== selectedLocation) return false;

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
                if (crowdCountB !== crowdCountA) return crowdCountB - crowdCountA;
                const goingCountB = getGoingCount(b.id);
                const goingCountA = getGoingCount(a.id);
                return goingCountB - goingCountA;
            });
    }, [places, searchQuery, selectedCategory, selectedCrowdLevel, checkIns, goingIntentions, checkedInPlace, goingToPlaceIds, selectedLocation]);

    if (isContextLoading || isLocalLoading) {
        return <LoadingSpinner message="Buscando locais..." />;
    }

    if (error) {
        return <div className="p-4 text-center text-red-400">{error}</div>;
    }
    
    const activeTabClass = 'border-b-2 border-accent text-text-primary';
    const inactiveTabClass = 'text-text-secondary hover:text-text-primary';

    return (
        <div className="p-4">
            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder="Buscar pelo nome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleRemoteSearch();
                        }
                    }}
                    className="w-full bg-surface px-4 py-2 pl-10 pr-12 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button 
                    onClick={handleRemoteSearch}
                    className="absolute right-0 top-0 bottom-0 px-3 flex items-center text-text-secondary hover:text-accent"
                    aria-label="Buscar local"
                >
                    <Search size={20} />
                </button>
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            </div>
            
            <div className="flex mb-6 border-b border-gray-700">
                <button
                    onClick={() => setViewMode('all')}
                    className={`flex-1 py-2 text-center font-semibold transition-colors flex items-center justify-center ${viewMode === 'all' ? activeTabClass : inactiveTabClass}`}
                >
                    <MapPin size={18} className="mr-2" />
                    Estabelecimentos
                </button>
                <button
                    onClick={() => setIsMapModalOpen(true)}
                    className={`flex-1 py-2 text-center font-semibold transition-colors flex items-center justify-center ${inactiveTabClass}`}
                >
                    <Map size={18} className="mr-2" />
                    Mapa
                </button>
                <button
                    onClick={() => setViewMode('favorites')}
                    className={`flex-1 py-2 text-center font-semibold transition-colors flex items-center justify-center ${viewMode === 'favorites' ? activeTabClass : inactiveTabClass}`}
                >
                    <Heart size={18} className="mr-2" />
                    Favoritos
                </button>
            </div>

            {viewMode === 'all' && (
                <>
                    {/* --- Seção de Locais Fixados --- */}
                    {checkedInPlace && (
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-primary mb-2">Check-in Ativo</h2>
                            <PinnedPlaceCard 
                                place={checkedInPlace} 
                                type="check-in" 
                                onCancel={checkOutUser} 
                            />
                        </div>
                    )}
                    {goingToPlaces.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-accent mb-2">Próximos Rolês</h2>
                            {goingToPlaces.map(place => (
                                <PinnedPlaceCard 
                                    key={place.id}
                                    place={place} 
                                    type="going" 
                                    onCancel={() => removeGoingIntention(place.id)} 
                                />
                            ))}
                        </div>
                    )}
                    {(checkedInPlace || goingToPlaces.length > 0) && otherPlaces.length > 0 && (
                        <hr className="border-gray-700 my-6" />
                    )}

                    {/* --- Filtros e Lista Principal --- */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
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
                                            handleLocationChange(loc); 
                                            setIsLocationOpen(false); 
                                        }} className="px-4 py-2 hover:bg-accent hover:text-white cursor-pointer">
                                            {loc}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div>
                        {otherPlaces.length > 0 ? (
                            otherPlaces.map(place => {
                                const hasActivePromotion = getActivePromotionsForPlace(place.id).length > 0;
                                return (
                                    <PlaceCard 
                                        key={place.id} 
                                        place={place} 
                                        crowdCount={getCrowdCount(place.id)}
                                        goingCount={getGoingCount(place.id)}
                                        livePostCount={getLivePostCount(place.id)}
                                        hasActivePromotion={hasActivePromotion}
                                    />
                                );
                            })
                        ) : (
                            <div className="text-center text-text-secondary mt-8">
                                <p>Nenhum local encontrado para "{selectedLocation}" com os filtros aplicados.</p>
                                <p className="text-sm">Tente ajustar sua busca ou filtros, ou pressione o ícone de busca para pesquisar remotamente.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {viewMode === 'favorites' && <FavoritePlacesList />}

            <MapModal 
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                places={places}
                checkIns={checkIns}
            />
        </div>
    );
};

export default MainPage;