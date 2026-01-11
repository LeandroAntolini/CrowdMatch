import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Star, Users, CalendarClock, XCircle, Heart, Radio, Clock, Ticket, Utensils } from 'lucide-react';
import MapModal from '../components/MapModal';
import LivePostForm from '../components/LivePostForm';
import LiveFeedBox from '../components/LiveFeedBox';
import PromotionClaimStatus from '../components/PromotionClaimStatus';
import { toast } from 'react-hot-toast';
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
    isUserGoingToPlace,
    isFavorite,
    addFavorite,
    removeFavorite,
    places,
    getLivePostCount,
    createLivePost,
    getActivePromotionsForPlace,
    promotionClaims,
    claimPromotion,
    currentUser,
    getUserOrderForPlace,
    getActiveTableForUser,
    fetchActiveOrdersStatus 
  } = useAppContext();

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [claimResult, setClaimResult] = useState<ClaimResultState | null>(null);
  const [confirmationTicket, setConfirmationTicket] = useState<{
    type: 'check-in' | 'going';
    timestamp: number;
    order: number;
  } | null>(null);
  const [activeTable, setActiveTable] = useState<number | null>(null);

  const place = id ? getPlaceById(id) : undefined;
  const currentCheckIn = getCurrentCheckIn();

  const isCheckedInHere = currentCheckIn?.placeId === id;
  const isGoingHere = id ? isUserGoingToPlace(id) : false;
  const isCheckedInElsewhere = currentCheckIn && !isCheckedInHere;
  const isCurrentlyFavorite = id ? isFavorite(id) : false;

  const activeGoingPromotions = id ? getActivePromotionsForPlace(id, 'FIRST_N_GOING') : [];
  const activeCheckinPromotions = id ? getActivePromotionsForPlace(id, 'FIRST_N_CHECKIN') : [];

  const crowdCount = (checkIns || []).filter((ci) => ci.placeId === place?.id).length;
  const goingCount = (goingIntentions || []).filter((gi) => gi.placeId === place?.id).length;

  const loadSessionData = useCallback(async () => {
    if (!id || !currentUser) return;

    const table = await getActiveTableForUser(id);
    setActiveTable(table);

    if (isCheckedInHere) {
      const order = getUserOrderForPlace(id, 'check-in');
      setConfirmationTicket({
        type: 'check-in',
        timestamp: currentCheckIn?.timestamp || Date.now(),
        order
      });
    } else if (isGoingHere) {
      const specificIntention = goingIntentions.find((gi) => gi.userId === currentUser.id && gi.placeId === id);
      const order = getUserOrderForPlace(id, 'going');
      setConfirmationTicket({
        type: 'going',
        timestamp: specificIntention?.timestamp || Date.now(),
        order
      });
    } else {
      setConfirmationTicket(null);
    }

    fetchActiveOrdersStatus();
  }, [id, currentUser, isCheckedInHere, isGoingHere, currentCheckIn, goingIntentions, getActiveTableForUser, getUserOrderForPlace, fetchActiveOrdersStatus]);

  useEffect(() => {
    loadSessionData();
    const interval = setInterval(loadSessionData, 10000);
    return () => clearInterval(interval);
  }, [loadSessionData]);

  const getUserClaim = (promotionId: string) => promotionClaims.find((c) => c.promotionId === promotionId);

  if (!place) return <LoadingSpinner />;

  const isNightlife = place?.category === 'Boate' || place?.category === 'Casa de Shows' || place?.category === 'Espaço Musical';
  const labelSingular = isNightlife ? 'Comanda' : 'Mesa';

  const menuLink = activeTable !== null ? `/menu/${place.id}/${activeTable}` : `/menu/${place.id}`;
  const menuButtonText = activeTable !== null ? `${labelSingular} ${activeTable}` : 'Cardápio Digital';
  const menuButtonClass = activeTable !== null ? 'bg-accent text-white text-sm font-black' : 'bg-gray-700/50 text-text-secondary text-xs font-bold';

  const handleFavoriteToggle = () => {
    if (!id) return;
    if (isCurrentlyFavorite) removeFavorite(id);
    else addFavorite(id);
  };

  const handlePostSubmit = async (content: string) => {
    if (place) await createLivePost(place.id, content);
  };

  const handleCheckIn = async () => {
    if (!id || !place.isOpen) return;
    await checkInUser(id);
    setClaimResult(null);
    await loadSessionData();
    let lastClaimResult: ClaimResultState | null = null;
    for (const promo of activeCheckinPromotions) {
      const result = await claimPromotion(promo.id);
      if (result) lastClaimResult = result;
    }
    if (lastClaimResult) setClaimResult(lastClaimResult);
  };

  const handleAddGoingIntention = async () => {
    if (!id) return;
    try {
      await addGoingIntention(id);
      setClaimResult(null);
      await loadSessionData();
      let lastClaimResult: ClaimResultState | null = null;
      for (const promo of activeGoingPromotions) {
        const result = await claimPromotion(promo.id);
        if (result) lastClaimResult = result;
      }
      if (lastClaimResult) setClaimResult(lastClaimResult);
    } catch (e: any) {
      toast.error(e?.message || 'Erro.');
    }
  };

  return (
    <div className="relative">
      <img src={place.photoUrl} alt={place.name} className="w-full h-64 object-cover" />
      <div className="absolute top-4 left-4">
        <button onClick={() => navigate(-1)} className="bg-black/50 text-white rounded-full p-2"><ChevronLeftIcon /></button>
      </div>
      <div className="absolute top-4 right-4 flex space-x-2">
        <button onClick={handleFavoriteToggle} className="bg-black/50 text-white rounded-full p-2 transition-colors">
          <Heart size={24} fill={isCurrentlyFavorite ? '#EC4899' : 'none'} stroke={isCurrentlyFavorite ? '#EC4899' : 'currentColor'} />
        </button>
      </div>

      <div className="p-4">
        <h1 className="text-3xl font-bold">{place.name}</h1>
        <div className="flex items-center mt-1"><p className="text-text-secondary">{place.category}</p></div>

        <div className="flex items-center space-x-4 my-4 text-text-secondary">
          <div className="flex items-center"><Star size={18} className="text-yellow-400 mr-1" /><span>{place.rating.toFixed(1)}</span></div>
          <div className="flex items-center"><Users size={18} className="text-primary mr-1" /><span>{crowdCount} aqui</span></div>
          <div className="flex items-center"><CalendarClock size={18} className="text-accent mr-1" /><span>{goingCount} pretendem ir</span></div>
        </div>

        <div className="flex items-center flex-wrap gap-3 mb-4">
          <div className={`px-2 py-0.5 text-xs font-semibold rounded-full inline-block ${place.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {place.isOpen ? 'Aberto Agora' : 'Fechado'}
          </div>
          <Link to={menuLink} className={`px-3 py-1 rounded-full flex items-center hover:bg-gray-600 transition-colors ${menuButtonClass}`}>
            <Utensils size={14} className="mr-1" /> {menuButtonText}
          </Link>
        </div>

        <button onClick={() => setIsMapModalOpen(true)} className="flex items-start text-left text-text-secondary mb-6 w-full hover:bg-surface p-2 rounded-lg transition-colors">
          <MapPin size={24} className="mr-2 flex-shrink-0 mt-1 text-accent" /> <span>{place.address}</span>
        </button>

        {/* ... Restante do conteúdo (Promos, Feed, etc) ... */}
        <LiveFeedBox place={place} showPlaceHeader={false} />
      </div>

      <MapModal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} places={places} checkIns={checkIns} highlightedPlaceId={id} />
    </div>
  );
};

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
);

export default PlaceDetailsPage;