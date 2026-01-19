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
    'music': { label: 'Som Top', icon: '🎵', color: 'text-primary' },
    'drinks': { label: 'Gelada', icon: '🍹', color: 'text-yellow-600' },
    'service': { label: 'Rápido', icon: '⚡', color: 'text-green-600' },
    'chill': { label: 'Tranquilo', icon: '😌', color: 'text-purple-600' },
};

const PlaceCard: React.FC<{ place: Place; crowdCount: number; goingCount: number; livePostCount: number; hasActivePromotion: boolean; vibes?: { [vibe: string]: number } }> = ({ place, crowdCount, goingCount, livePostCount, hasActivePromotion, vibes }) => {
    const topVibe = useMemo(() => {
        if (!vibes || Object.keys(vibes).length === 0) return null;
        const sorted = Object.entries(vibes).sort((a, b) => b[1] - a[1]);
        return VIBE_INFO[sorted[0][0]];
    }, [vibes]);

    return (
        <Link to={`/place/${place.id}`} className="block bg-white rounded-xl p-3 mb-3 border border-border-subtle hover:bg-secondary transition-all duration-200">
            <div className="flex items-center space-x-3">
                <div className="relative flex-shrink-0">
                    <img src={place.photoUrl} alt={place.name} className="w-16 h-16 rounded-lg object-cover border border-border-subtle" />
                    {crowdCount > 5 && (
                        <div className="absolute -top-1.5 -left-1.5 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Hot</div>
                    )}
                </div>
                <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-base text-text-primary truncate">{place.name}</h3>
                        {topVibe && (
                            <span className="flex items-center text-[9px] font-black uppercase text-text-secondary">
                                <span className="mr-1">{topVibe.icon}</span>
                                {topVibe.label}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-text-secondary truncate">{place.category} &bull; {place.city}</p>
                    
                    <div className="flex items-center space-x-3 mt-2">
                        <div className="flex items-center text-[10px] font-bold text-text-primary">
                            <Users size={12} className="mr-1 text-primary" />
                            <span>{crowdCount}</span>
                        </div>
                        <div className="flex items-center text-[10px] font-bold text-text-primary">
                            <CalendarClock size={12} className="mr-1 text-accent" />
                            <span>{goingCount}</span>
                        </div>
                        {hasActivePromotion && (
                            <div className="flex items-center text-[10px] font-bold text-accent">
                                <Ticket size={12} className="mr-1" />
                                <span>PROMO</span>
                            </div>
                        )}
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
        checkOutUser, placesVibes
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

    const trendingPlaces = useMemo(() => {
        return places
            .map(p => ({ ...p, score: getCrowdCount(p.id) * 2 + getGoingCount(p.id) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
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

    if (isLoading) return <LoadingSpinner message="Explorando..." />;

    const activeTabClass = 'text-text-primary border-b-2 border-text-primary';
    const inactiveTabClass = 'text-text-secondary hover:text-text-primary';

    return (
        <div className="bg-background min-h-full pb-20">
            <div className="p-4 bg-white border-b border-border-subtle sticky top-0 z-50">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Pesquisar local..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRemoteSearch()}
                        className="w-full bg-secondary px-4 py-2.5 pl-10 pr-12 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-border-subtle"
                    />
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                </div>
            </div>
            
            <div className="px-4 py-2 flex space-x-6 border-b border-border-subtle text-sm font-bold bg-white">
                <button onClick={() => setViewMode('all')} className={`pb-2 transition-all ${viewMode === 'all' ? activeTabClass : inactiveTabClass}`}>Explorar</button>
                <button onClick={() => setViewMode('favorites')} className={`pb-2 transition-all ${viewMode === 'favorites' ? activeTabClass : inactiveTabClass}`}>Favoritos</button>
                <button onClick={() => setIsMapModalOpen(true)} className={`pb-2 transition-all ${inactiveTabClass}`}>Mapa</button>
            </div>

            <div className="p-4">
                {viewMode === 'all' && (
                    <>
                        {trendingPlaces.length > 0 && !searchQuery && selectedCategory === 'Todos' && (
                            <div className="mb-8 overflow-hidden">
                                <h2 className="text-xs font-black uppercase text-text-primary mb-4 tracking-wider flex items-center">
                                    <TrendingUp size={14} className="mr-2 text-primary" /> Bombando Agora
                                </h2>
                                <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
                                    {trendingPlaces.map(p => (
                                        <Link key={p.id} to={`/place/${p.id}`} className="flex-shrink-0 w-32">
                                            <div className="relative aspect-square rounded-2xl overflow-hidden border border-border-subtle mb-2">
                                                <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                <div className="absolute bottom-2 left-2 right-2">
                                                    <p className="text-[10px] text-white font-bold truncate leading-tight">{p.name}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {checkedInPlace && (
                            <div className="mb-8 p-4 bg-primary/5 rounded-2xl border border-primary/20">
                                <h2 className="text-[10px] font-black text-primary mb-3 uppercase tracking-widest flex items-center">
                                    <Zap size={14} className="mr-2" /> Check-in Ativo
                                </h2>
                                <PinnedPlaceCard place={checkedInPlace} type="check-in" onCancel={checkOutUser} />
                            </div>
                        )}

                        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                            <div className="relative" ref={categoryRef}>
                                <button onClick={() => setIsCategoryOpen(!isCategoryOpen)} className={`px-4 py-2 rounded-lg text-xs font-bold border ${selectedCategory !== 'Todos' ? 'bg-text-primary text-white border-text-primary' : 'bg-white border-border-subtle text-text-primary'}`}>
                                    {selectedCategory} <ChevronDown size={14} className="inline ml-1" />
                                </button>
                                {isCategoryOpen && (
                                    <ul className="absolute z-30 mt-2 bg-white border border-border-subtle rounded-xl shadow-xl py-2 min-w-[150px]">
                                        {categories.map(cat => <li key={cat} onClick={() => { setSelectedCategory(cat); setIsCategoryOpen(false); }} className="px-5 py-2 hover:bg-secondary cursor-pointer text-xs font-medium">{cat}</li>)}
                                    </ul>
                                )}
                            </div>

                            <div className="relative" ref={vibeRef}>
                                <button onClick={() => setIsVibeOpen(!isVibeOpen)} className={`px-4 py-2 rounded-lg text-xs font-bold border ${selectedVibe !== 'Todos' ? 'bg-accent text-white border-accent' : 'bg-white border-border-subtle text-text-primary'}`}>
                                    <Filter size={14} className="inline mr-1" /> Vibe <ChevronDown size={14} className="inline ml-1" />
                                </button>
                                {isVibeOpen && (
                                    <ul className="absolute z-30 mt-2 bg-white border border-border-subtle rounded-xl shadow-xl py-2 min-w-[150px]">
                                        <li onClick={() => { setSelectedVibe('Todos'); setIsVibeOpen(false); }} className="px-5 py-2 hover:bg-secondary cursor-pointer text-xs font-bold border-b border-border-subtle mb-1">Todas</li>
                                        {Object.entries(VIBE_INFO).map(([key, info]) => (
                                            <li key={key} onClick={() => { setSelectedVibe(key); setIsVibeOpen(false); }} className="px-5 py-2 hover:bg-secondary cursor-pointer text-xs font-medium flex items-center">
                                                <span className="mr-2">{info.icon}</span> {info.label}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            {filteredPlaces.length > 0 ? filteredPlaces.map(place => (
                                <PlaceCard key={place.id} place={place} crowdCount={getCrowdCount(place.id)} goingCount={getGoingCount(place.id)} livePostCount={getLivePostCount(place.id)} hasActivePromotion={getActivePromotionsForPlace(place.id).length > 0} vibes={placesVibes[place.id]} />
                            )) : (
                                <div className="text-center py-20 opacity-40"><Search size={48} className="mx-auto mb-4" /><p className="font-bold">Sem resultados.</p></div>
                            )}
                        </div>
                    </>
                )}

                {viewMode === 'favorites' && <FavoritePlacesList />}
            </div>

            <MapModal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} places={places} checkIns={checkIns} />
        </div>
    );
};

export default MainPage;