import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Star, Users, CalendarClock, DoorOpen, XCircle, Heart, Radio, Clock } from 'lucide-react';
import MapModal from '../components/MapModal';
import LivePostForm from '../components/LivePostForm';
import LiveFeedBox from '../components/LiveFeedBox';

const PlaceDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { 
        getPlaceById, 
        checkInUser, 
        checkOutUser, 
        getCurrentCheckIn, 
        checkIns,
        goingIntentions,
        addGoingIntention,
        removeGoingIntention,
        getCurrentGoingIntention,
        isFavorite,
        addFavorite,
        removeFavorite,
        places,
        getLivePostCount,
        createLivePost
    } = useAppContext();
    
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    
    const place = id ? getPlaceById(id) : undefined;
    const currentCheckIn = getCurrentCheckIn();
    const currentGoingIntention = getCurrentGoingIntention();

    const isCheckedInHere = currentCheckIn?.placeId === id;
    const isGoingHere = currentGoingIntention?.placeId === id;
    const isBusyElsewhere = (currentCheckIn && !isCheckedInHere) || (currentGoingIntention && !isGoingHere);
    const busyPlaceId = currentCheckIn?.placeId || currentGoingIntention?.placeId;
    const busyPlace = busyPlaceId ? getPlaceById(busyPlaceId) : null;
    
    const isCurrentlyFavorite = id ? isFavorite(id) : false;

    const handleMarkerClick = (placeId: string) => {
        setIsMapModalOpen(false);
        navigate(`/place/${placeId}`);
    };

    if (!place) {
        return <LoadingSpinner />;
    }
    
    const handleFavoriteToggle = () => {
        if (!id) return;
        if (isCurrentlyFavorite) {
            removeFavorite(id);
        } else {
            addFavorite(id);
        }
    };

    const handlePostSubmit = async (content: string) => {
        if (place) {
            await createLivePost(place.id, content);
        }
    };

    const crowdCount = (checkIns || []).filter(ci => ci.placeId === place.id).length;
    const goingCount = (goingIntentions || []).filter(gi => gi.placeId === place.id).length;
    const livePostCount = getLivePostCount(place.id);

    return (
        <div className="relative">
            <img src={place.photoUrl} alt={place.name} className="w-full h-64 object-cover" />
            <div className="absolute top-4 left-4">
                <button onClick={() => navigate(-1)} className="bg-black/50 text-white rounded-full p-2">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                </button>
            </div>
            <div className="absolute top-4 right-4">
                <button onClick={handleFavoriteToggle} className="bg-black/50 text-white rounded-full p-2 transition-colors">
                    <Heart size={24} fill={isCurrentlyFavorite ? '#EC4899' : 'none'} stroke={isCurrentlyFavorite ? '#EC4899' : 'currentColor'} />
                </button>
            </div>
            
            <div className="p-4">
                <h1 className="text-3xl font-bold">{place.name}</h1>
                <p className="text-text-secondary mt-1">{place.category}</p>
                
                <div className="flex items-center space-x-4 my-4 text-text-secondary">
                    <div className="flex items-center">
                        <Star size={18} className="text-yellow-400 mr-1" />
                        <span>{place.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center">
                        <Users size={18} className="text-primary mr-1" />
                        <span>{crowdCount} aqui</span>
                    </div>
                    <div className="flex items-center">
                        <CalendarClock size={18} className="text-accent mr-1" />
                        <span>{goingCount} pretendem ir</span>
                    </div>
                    <div className="flex items-center">
                        <Radio size={18} className="text-blue-400 mr-1" />
                        <span>{livePostCount} ao vivo</span>
                    </div>
                </div>
                
                <div className={`px-2 py-0.5 text-xs font-semibold rounded-full inline-block mb-4 ${place.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {place.isOpen ? "Aberto Agora" : "Fechado"}
                </div>

                <button onClick={() => setIsMapModalOpen(true)} className="flex items-start text-left text-text-secondary mb-6 w-full hover:bg-surface p-2 rounded-lg transition-colors">
                    <MapPin size={24} className="mr-2 flex-shrink-0 mt-1 text-accent" />
                    <span>{place.address}</span>
                </button>

                <div className="mt-6 p-4 bg-surface rounded-lg">
                    {(() => {
                        if (isCheckedInHere) {
                            return (
                                <div className="text-center">
                                    <p className="text-green-400 font-semibold mb-2">Você está aqui!</p>
                                    <button onClick={checkOutUser} className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center">
                                        <DoorOpen className="mr-2" size={20} />
                                        Sair do Local
                                    </button>
                                </div>
                            );
                        }
                        if (isGoingHere) {
                            return (
                                <div className="text-center">
                                    <p className="text-accent font-semibold mb-2">Você marcou que vai!</p>
                                    <button onClick={removeGoingIntention} className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center">
                                        <XCircle className="mr-2" size={20} />
                                        Cancelar Intenção
                                    </button>
                                </div>
                            );
                        }
                        if (isBusyElsewhere) {
                            return (
                                <div className="text-center">
                                    <p className="text-yellow-400 font-semibold">Você já tem um plano!</p>
                                    <p className="text-sm text-text-secondary">Seu status está ativo em "{busyPlace?.name}".</p>
                                </div>
                            );
                        }
                        return (
                            <div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button 
                                        onClick={() => checkInUser(place.id)}
                                        disabled={!place.isOpen}
                                        className="flex-1 bg-primary text-background font-bold py-3 px-4 rounded-lg hover:bg-pink-200 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        <Users className="mr-2" size={20} />
                                        Estou Aqui
                                    </button>
                                    <button 
                                        onClick={() => addGoingIntention(place.id)}
                                        className="flex-1 bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center"
                                    >
                                        <CalendarClock className="mr-2" size={20} />
                                        Eu Vou
                                    </button>
                                </div>
                                {!place.isOpen && (
                                    <p className="text-xs text-center text-text-secondary mt-3">O botão "Estou Aqui" fica disponível durante o horário de funcionamento.</p>
                                )}
                            </div>
                        );
                    })()}
                </div>

                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Feed Ao Vivo</h2>
                    {isCheckedInHere && (
                        <div className="mb-6">
                            <div className="flex items-center text-sm text-text-secondary mb-2 p-2 bg-gray-800 rounded-lg">
                                <Clock size={16} className="mr-2 text-accent" />
                                <span>Seu post ficará visível por 1 hora.</span>
                            </div>
                            <LivePostForm onSubmit={handlePostSubmit} />
                        </div>
                    )}
                    <LiveFeedBox place={place} showPlaceHeader={false} />
                </div>
            </div>
            
            <MapModal 
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                places={places}
                checkIns={checkIns}
                onMarkerClick={handleMarkerClick}
                highlightedPlaceId={id}
            />
        </div>
    );
};

export default PlaceDetailsPage;