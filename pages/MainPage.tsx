import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Place } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, CalendarClock, ChevronDown, MapPin, Search, Heart, Map, Radio, Ticket, Zap, TrendingUp, Filter } from 'lucide-react';
import { citiesByState } from '../data/locations';
import FavoritePlacesList from '../components/FavoritePlacesList';
import MapModal from '../components/MapModal';
import PinnedPlaceCard from '../components/PinnedPlaceCard';

const getCrowdLevelText = (count: number): 'Tranquilo' | 'Moderado' | 'Agitado' => {
    if (count < 2) return 'Tranquilo';
    if (count < 5) return 'Moderado';
    return 'Agitado';
};

const VIBE_INFO: { [key: string]: { label: string, icon: string, color: string } } = {
    'fire': { label: 'Bombando', icon: '🔥', color: 'text-orange-500' },
    'music': { label: 'Som Top', icon: '🎵', color: 'text-blue-400' },
    'drinks': { label: 'Gelada', icon: '🍹', color: 'text-yellow-400' },
    'service': { label: 'Rápido', icon: '⚡', color: 'text-green-400' },
    'chill': { label: 'Tranquilo', icon: '😌', color: 'text-purple-400' },
};

const PlaceCard: React.FC<{ place: Place; crowdCount: number; goingCount: number; livePostCount: number; hasActivePromotion: boolean; vibes?: { [vibe: string]: number } }> = ({ place, crowdCount, goingCount, livePostCount, hasActivePromotion, vibes }) => {
    const promotionClass = hasActivePromotion ? 'bg-yellow-400/20 text-yellow-400' : 'bg-gray-600/50 text-gray-500';

    const topVibe = useMemo(() => {
        if (!vibes || Object.keys(vibes).length === 0) return null;
        const sorted = Object.entries(vibes).sort((a, b) => b[1] - a[1]);
        return VIBE_INFO[sorted[0][0]];
    }, [vibes]);

    return (
        <Link to={`/place/${place.id}`} className="block bg-surface rounded-2xl p-4 mb-4 shadow-md hover:bg-gray-700 transition-all duration-200 border border-gray-800 hover:border-gray-600">
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <img src={place.photoUrl} alt={place.name} className="w-20 h-20 rounded-xl object-cover" />
                    {crowdCount > 5 && (
                        <div className="absolute -top-2 -left-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse uppercase">Hot</div>
                    )}
                </div>
                <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-text-primary leading-tight truncate">{place.name}</h3>
                        {topVibe && (
                            <span className={`flex items-center bg-gray-800/80 px-2 py-0.5 rounded-lg border border-gray-700 ml-2 whitespace-nowrap`}>
                                <span className="mr-1">{topVibe.icon}</span>
                                <span className={`text-[9px] font-black uppercase ${topVibe.color}`}>{topVibe.label}</span>
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-text-secondary truncate">{place.category} &bull; {place.city}</p>
                    
                    <div className="flex items-center flex-wrap gap-2 mt-3">
                        <div className="flex items-center text-[10px] bg-primary/10 text-primary font-bold px-2 py-1 rounded-lg border border-primary/20">
                            <Users size={12} className="mr-1" />
                            <span>{crowdCount}</span>
                        </div>
                        <div className="flex items-center text-[10px] bg-accent/10 text-accent font-bold px-2 py-1 rounded-lg border border-accent/20">
                            <CalendarClock size={12} className="mr-1" />
                            <span>{goingCount}</span>
                        </div>
                        {livePostCount > 0 && (
                            <div className="flex items-center text-[10px] bg-blue-400/10 text-blue-400 font-bold px-2 py-1 rounded-lg border border-blue-400/20">
                                <Radio size={12} className="mr-1" />
                                <span>{livePostCount}</span>
                            </div>
                        )}
                        <div className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-lg border border-transparent ${promotionClass}`}>
                            <Ticket size={12} className="mr-1" />
                            <span>Promo</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};


const MainPage: React.FC = () => {
    const { 
        places, checkIns, goingIntentions, isLoading, error, currentUser, fetchPlaces, 
        getLivePostCount, getActivePromotionsForPlace, getCurrentCheckIn, getPlaceById,
        checkOutUser, removeGoingIntention, placesVibes
    } = useAppContext();
    
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [selectedVibe, setSelectedVibe] = useState<string>('Todos');
    const [selectedLocation, setSelectedLocation] = useState<string>(currentUser?.city || '');
    const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isVibeOpen, setIsVibeOpen] = useState(false);
    const [isLocationOpen, setIsLocationOpen] = useState(false);

    const categoryRef = useRef<HTMLDivElement>(null);
    const vibeRef = useRef<HTMLDivElement>(null);
    const locationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentUser?.city && !selectedLocation) {
            setSelectedLocation(currentUser.city);
        }
    }, [currentUser?.city, selectedLocation]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) setIsCategoryOpen(false);
            if (vibeRef.current && !vibeRef.current.contains(event.target as Node)) setIsVibeOpen(false);
            if (locationRef.current && !locationRef.current.contains(event.target as Node)) setIsLocationOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getCrowdCount = (placeId: string) => (checkIns || []).filter(ci => ci.placeId === placeId).length;
    const getGoingCount = (placeId: string) => (goingIntentions || []).filter(gi => gi.placeId === placeId).length;

    const categories = useMemo(() => {
        if (!places) return ['Todos'];
        const uniqueCategories = new Set(places.map(place => place.category));
        return ['Todos', ...Array.from(uniqueCategories).sort()];
    }, [places]);
    
    const locations = useMemo(() => {
        if (currentUser?.state && citiesByState[currentUser.state]) {
            return citiesByState[currentUser.state];
        }
        return currentUser?.city ? [currentUser.city] : [];
    }, [currentUser?.state, currentUser?.city]);

    const handleRemoteSearch = () => {
        if (currentUser?.state && selectedLocation) {
            fetchPlaces(selectedLocation, currentUser.state, searchQuery.trim());
            setSelectedCategory('Todos');
            setSelectedVibe('Todos');
            setViewMode('all');
        }
    };

    const currentCheckIn = getCurrentCheckIn();
    const checkedInPlace = currentCheckIn ? getPlaceById(currentCheckIn.placeId) : null;

    const goingToPlaceIds = useMemo(() => 
        new Set(goingIntentions.filter(gi => gi.userId === currentUser?.id).map(gi => gi.placeId)),
        [goingIntentions, currentUser]
    );

    const trendingPlaces = useMemo(() => {
        return places
            .map(p => ({ ...p, score: getCrowdCount(p.id) * 2 + getGoingCount(p.id) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .filter(p => p.score > 0);
    }, [places, checkIns, goingIntentions]);

    const filteredPlaces = useMemo(() => {
        return places
            .filter(place => {
                if (selectedLocation && place.city !== selectedLocation) return false;

                const searchMatch = place.name.toLowerCase().includes(searchQuery.toLowerCase());
                if (!searchMatch) return false;

                const categoryMatch = selectedCategory === 'Todos' || place.category === selectedCategory;
                if (!categoryMatch) return false;

                if (selectedVibe !== 'Todos') {
                    const vibes = placesVibes[place.id] || {};
                    const sortedVibes = Object.entries(vibes).sort((a, b) => b[1] - a[1]);
                    if (sortedVibes.length === 0 || sortedVibes[0][0] !== selectedVibe) return false;
                }
                
                return true;
            })
            .sort((a, b) => getCrowdCount(b.id) - getCrowdCount(a.id));
    }, [places, searchQuery, selectedCategory, selectedVibe, checkIns, placesVibes, selectedLocation]);

    if (isLoading) {
        return <LoadingSpinner message="Buscando locais..." />;
    }

    const activeTabClass = 'border-b-2 border-accent text-text-primary';
    const inactiveTabClass = 'text-text-secondary hover:text-text-primary';

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar pelo nome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRemoteSearch()}
                    className="w-full bg-surface px-4 py-3 pl-10 pr-12 rounded-xl text-text-primary focus:outline-none border border-gray-800 focus:border-accent"
                />
                <button onClick={handleRemoteSearch} className="absolute right-0 top-0 bottom-0 px-3 flex items-center text-text-secondary hover:text-accent">
                    <Search size={20} />
                </button>
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            </div>
            
            <div className="flex border-b border-gray-700">
                <button onClick={() => setViewMode('all')} className={`flex-1 py-2 text-center font-bold transition-colors flex items-center justify-center ${viewMode === 'all' ? activeTabClass : inactiveTabClass}`}>
                    <MapPin size={18} className="mr-2" /> Descobrir
                </button>
                <button onClick={() => setIsMapModalOpen(true)} className={`flex-1 py-2 text-center font-bold transition-colors flex items-center justify-center ${inactiveTabClass}`}>
                    <Map size={18} className="mr-2" /> Mapa
                </button>
                <button onClick={() => setViewMode('favorites')} className={`flex-1 py-2 text-center font-bold transition-colors flex items-center justify-center ${viewMode === 'favorites' ? activeTabClass : inactiveTabClass}`}>
                    <Heart size={18} className="mr-2" /> Favoritos
                </button>
            </div>

            {viewMode === 'all' && (
                <>
                    {/* BOMBANDO AGORA - CARROSSEL */}
                    {trendingPlaces.length > 0 && !searchQuery && selectedCategory === 'Todos' && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-sm font-black uppercase text-accent mb-4 flex items-center tracking-widest">
                                <TrendingUp size={16} className="mr-2" /> Bombando Agora
                            </h2>
                            <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2">
                                {trendingPlaces.map(p => (
                                    <Link key={p.id} to={`/place/${p.id}`} className="flex-shrink-0 w-40 group">
                                        <div className="relative aspect-square rounded-2xl overflow-hidden mb-2 shadow-lg">
                                            <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                            <div className="absolute bottom-2 left-2 right-2">
                                                <p className="text-white font-bold text-xs truncate leading-tight">{p.name}</p>
                                                <div className="flex items-center text-[10px] text-primary font-black mt-1 uppercase">
                                                    <Users size={10} className="mr-1" /> {getCrowdCount(p.id)} presentes
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {checkedInPlace && (
                        <div className="bg-accent/5 p-4 rounded-2xl border border-accent/20">
                            <h2 className="text-[10px] font-black text-accent mb-3 uppercase tracking-[0.2em] flex items-center">
                                <Zap size={14} className="mr-2" /> Check-in Ativo
                            </h2>
                            <PinnedPlaceCard place={checkedInPlace} type="check-in" onCancel={checkOutUser} />
                        </div>
                    )}

                    {/* FILTROS INTELIGENTES */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                        {/* Filtro de Categoria */}
                        <div className="relative" ref={categoryRef}>
                            <button onClick={() => setIsCategoryOpen(!isCategoryOpen)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory !== 'Todos' ? 'bg-accent border-accent text-white' : 'bg-surface border-gray-800 text-text-secondary'}`}>
                                <span>{selectedCategory === 'Todos' ? 'Categoria' : selectedCategory}</span>
                                <ChevronDown size={14} />
                            </button>
                            {isCategoryOpen && (
                                <ul className="absolute z-30 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar py-2">
                                    {categories.map(cat => (
                                        <li key={cat} onClick={() => { setSelectedCategory(cat); setIsCategoryOpen(false); }} className={`px-5 py-2 hover:bg-accent hover:text-white cursor-pointer text-xs font-medium ${selectedCategory === cat ? 'text-accent' : ''}`}>
                                            {cat}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Filtro de Vibe */}
                        <div className="relative" ref={vibeRef}>
                            <button onClick={() => setIsVibeOpen(!isVibeOpen)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${selectedVibe !== 'Todos' ? 'bg-primary border-primary text-background' : 'bg-surface border-gray-800 text-text-secondary'}`}>
                                <Filter size={14} className="mr-1" />
                                <span>{selectedVibe === 'Todos' ? 'Qualquer Vibe' : VIBE_INFO[selectedVibe]?.label}</span>
                                <ChevronDown size={14} />
                            </button>
                            {isVibeOpen && (
                                <ul className="absolute z-30 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-2 w-48">
                                    <li onClick={() => { setSelectedVibe('Todos'); setIsVibeOpen(false); }} className="px-5 py-2 hover:bg-primary hover:text-background cursor-pointer text-xs font-bold">Qualquer Vibe</li>
                                    {Object.entries(VIBE_INFO).map(([key, info]) => (
                                        <li key={key} onClick={() => { setSelectedVibe(key); setIsVibeOpen(false); }} className="px-5 py-2 hover:bg-primary hover:text-background cursor-pointer text-xs font-medium flex items-center">
                                            <span className="mr-2">{info.icon}</span> {info.label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Localização */}
                        <div className="relative" ref={locationRef}>
                            <button onClick={() => setIsLocationOpen(!isLocationOpen)} className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-surface border border-gray-800 text-text-secondary">
                                <MapPin size={14} className="text-primary" />
                                <span>{selectedLocation || 'Cidade'}</span>
                                <ChevronDown size={14} />
                            </button>
                            {isLocationOpen && (
                                <ul className="absolute z-30 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-2">
                                    {locations.map(loc => (
                                        <li key={loc} onClick={() => { setSelectedLocation(loc); setIsLocationOpen(false); if (currentUser?.state) fetchPlaces(loc, currentUser.state); }} className="px-5 py-2 hover:bg-accent hover:text-white cursor-pointer text-xs font-medium">
                                            {loc}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] px-1">Resultados</h2>
                        {filteredPlaces.length > 0 ? (
                            filteredPlaces.map(place => (
                                <PlaceCard 
                                    key={place.id} 
                                    place={place} 
                                    crowdCount={getCrowdCount(place.id)}
                                    goingCount={getGoingCount(place.id)}
                                    livePostCount={getLivePostCount(place.id)}
                                    hasActivePromotion={getActivePromotionsForPlace(place.id).length > 0}
                                    vibes={placesVibes[place.id]}
                                />
                            ))
                        ) : (
                            <div className="text-center py-20 opacity-40">
                                <Search size={48} className="mx-auto mb-4" />
                                <p className="font-bold">Nenhum local com esses filtros.</p>
                                <button onClick={() => { setSelectedCategory('Todos'); setSelectedVibe('Todos'); }} className="text-accent text-xs mt-2 underline">Limpar filtros</button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {viewMode === 'favorites' && <FavoritePlacesList />}

            <MapModal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} places={places} checkIns={checkIns} />
        </div>
    );
};

export default MainPage;