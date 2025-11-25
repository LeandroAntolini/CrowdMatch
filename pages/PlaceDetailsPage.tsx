import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Star, Users, CalendarClock, DoorOpen, XCircle, Heart, Radio, Clock, Ticket } from 'lucide-react';
import MapModal from '../components/MapModal';
import LivePostForm from '../components/LivePostForm';
import LiveFeedBox from '../components/LiveFeedBox';
import PromotionClaimStatus from '../components/PromotionClaimStatus';
import { PromotionType } from '../types';
import ConfirmationTicket from '../components/ConfirmationTicket';

interface ClaimResultState {
    message: string;
    isWinner: boolean;
    claimOrder?: number;
}

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
        createLivePost,
        getActivePromotionsForPlace,
        promotionClaims,
        claimPromotion,
        currentUser
    } = useAppContext();
    
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [claimMessage, setClaimMessage] = useState<ClaimResultState | null>(null);
    const [confirmationTicket, setConfirmationTicket] = useState<{ type: 'check-in' | 'going'; timestamp: number; order: number } | null>(null);
    
    const place = id ? getPlaceById(id) : undefined;
    const currentCheckIn = getCurrentCheckIn();
    const currentGoingIntention = getCurrentGoingIntention();

    const isCheckedInHere = currentCheckIn?.placeId === id;
    const isGoingHere = currentGoingIntention?.placeId === id;
    const isBusyElsewhere = (currentCheckIn && !isCheckedInHere) || (currentGoingIntention && !isGoingHere);
    const busyPlaceId = currentCheckIn?.placeId || currentGoingIntention?.placeId;
    const busyPlace = busyPlaceId ? getPlaceById(busyPlaceId) : null;
    
    const isCurrentlyFavorite = id ? isFavorite(id) : false;

    const activeGoingPromotions = id ? getActivePromotionsForPlace(id, 'FIRST_N_GOING') : [];
    const activeCheckinPromotions = id ? getActivePromotionsForPlace(id, 'FIRST_N_CHECKIN') : [];
    
    const crowdCount = (checkIns || []).filter(ci => ci.placeId === place?.id).length;
    const goingCount = (goingIntentions || []).filter(gi => gi.placeId === place?.id).length;

    useEffect(() => {
        if (isCheckedInHere) {
            setConfirmationTicket({
                type: 'check-in',
                timestamp: currentCheckIn?.timestamp || Date.now(),
                order: crowdCount
            });
        } else if (isGoingHere) {
            setConfirmationTicket({
                type: 'going',
                timestamp: currentGoingIntention?.timestamp || Date.now(),
                order: goingCount
            });
        } else {
            setConfirmationTicket(null);
        }
    }, [isCheckedInHere, isGoingHere, currentCheckIn, currentGoingIntention, crowdCount, goingCount]);

    const getUserClaim = (promotionId: string) => promotionClaims.find(c => c.promotionId === promotionId);

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

    const handleCheckIn = async () => {
        if (!id) return;
        await checkInUser(id);
        activeCheckinPromotions.forEach(async (promo) => {
            const result = await claimPromotion(promo.id);
            if (result) setClaimMessage(result);
        });
    };

    const handleAddGoingIntention = async () => {
        if (!id) return;
        await addGoingIntention(id);
        activeGoingPromotions.forEach(async (promo) => {
            const result = await claimPromotion(promo.id);
            if (result) setClaimMessage(result);
        });
    };

    const handleCheckOut = () => {
        checkOutUser();
        setConfirmationTicket(null);
    };

    const handleRemoveGoing = () => {
        removeGoingIntention();
        setConfirmationTicket(null);
    };

    const livePostCount = getLivePostCount(place.id);
    
    const qrCodeValue = confirmationTicket && currentUser
        ? `${currentUser.id}|${place.id}|${confirmationTicket.timestamp}|${confirmationTicket.type}`
        : 'invalid';

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
                
                {(activeGoingPromotions.length > 0 || activeCheckinPromotions.length > 0) && (
                    <div className="mt-6 mb-6">
                        <h2 className="text-2xl font-bold mb-3 flex items-center">
                            <Ticket size={24} className="mr-2 text-accent" />
                            Promoções Ativas
                        </h2>
                        {[...activeGoingPromotions, ...activeCheckinPromotions].map(promo => (
                            <PromotionClaimStatus 
                                key={promo.id} 
                                promotion={promo} 
                                claim={getUserClaim(promo.id)}
                                claimOrder={claimMessage?.claimOrder}
                            />
                        ))}
                    </div>
                )}

                {claimMessage && (
                    <div className={`p-4 rounded-lg mb-4 ${claimMessage.isWinner ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        <p className="font-semibold">{claimMessage.message}</p>
                    </div>
                )}

                <div className="mt-6 p-4 bg-surface rounded-lg">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="w-full sm:w-1/2 space-y-3">
                            {isBusyElsewhere && !isCheckedInHere && !isGoingHere ? (
                                <div className="text-center p-4 bg-gray-800 rounded-lg h-full flex flex-col justify-center">
                                    <p className="font-semibold text-yellow-400">Você já tem um plano!</p>
                                    <p className="text-sm text-text-secondary">Seu status está ativo em "{busyPlace?.name}".</p>
                                </div>
                            ) : (
                                <>
                                    <button 
                                        onClick={handleCheckIn}
                                        disabled={!place.isOpen || isCheckedInHere || isGoingHere}
                                        className="w-full bg-primary text-background font-bold py-2 px-4 rounded-lg hover:bg-pink-200 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                                    >
                                        <Users className="mr-2" size={18} />
                                        Estou Aqui
                                    </button>
                                    <button 
                                        onClick={handleAddGoingIntention}
                                        disabled={isCheckedInHere || isGoingHere}
                                        className="w-full bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-pink-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                                    >
                                        <CalendarClock className="mr-2" size={18} />
                                        Eu Vou
                                    </button>
                                    {!place.isOpen && !isCheckedInHere && (
                                        <p className="text-xs text-center text-text-secondary mt-2">O check-in fica disponível durante o horário de funcionamento.</p>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="w-full sm:w-1/2">
                            {confirmationTicket && (
                                <div className="flex flex-col items-center">
                                    <ConfirmationTicket 
                                        type={confirmationTicket.type}
                                        placeName={place.name}
                                        timestamp={confirmationTicket.timestamp}
                                        order={confirmationTicket.order}
                                        qrCodeValue={qrCodeValue}
                                    />
                                    <button 
                                        onClick={isCheckedInHere ? handleCheckOut : handleRemoveGoing}
                                        className="mt-3 w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center text-sm"
                                    >
                                        <XCircle className="mr-2" size={18} />
                                        {isCheckedInHere ? 'Cancelar Check-in' : 'Cancelar Intenção'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
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