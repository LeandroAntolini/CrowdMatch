import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Star, Users, CalendarClock, XCircle, Heart, Radio, Clock, Ticket, Utensils, Zap } from 'lucide-react';
import MapModal from '../components/MapModal';
import LivePostForm from '../components/LivePostForm';
import LiveFeedBox from '../components/LiveFeedBox';
import PromotionClaimStatus from '../components/PromotionClaimStatus';
import WhoIsHere from '../components/WhoIsHere';
import { toast } from 'react-hot-toast';
import ConfirmationTicket from '../components/ConfirmationTicket';

interface ClaimResultState {
  message: string;
  isWinner: boolean;
  claimOrder?: number;
}

const VIBE_OPTIONS = [
    { type: 'fire', label: 'Bombando', icon: '🔥' },
    { type: 'music', label: 'Som Top', icon: '🎵' },
    { type: 'drinks', label: 'Gelada', icon: '🍹' },
    { type: 'service', label: 'Rápido', icon: '⚡' },
    { type: 'chill', label: 'Tranquilo', icon: '😌' },
];

const PlaceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    getPlaceById, checkInUser, checkOutUser, getCurrentCheckIn, checkIns, goingIntentions,
    addGoingIntention, removeGoingIntention, isUserGoingToPlace, isFavorite, addFavorite,
    removeFavorite, places, getLivePostCount, createLivePost, getActivePromotionsForPlace,
    promotionClaims, claimPromotion, currentUser, getUserOrderForPlace, getActiveTableForUser,
    fetchActiveOrdersStatus, fetchUsersForPlace, userProfilesCache, reportVibe, getVibesForPlace
  } = useAppContext();

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [claimResult, setClaimResult] = useState<ClaimResultState | null>(null);
  const [confirmationTicket, setConfirmationTicket] = useState<{ type: 'check-in' | 'going'; timestamp: number; order: number; } | null>(null);
  const [activeTable, setActiveTable] = useState<number | null>(null);
  const [placeVibes, setPlaceVibes] = useState<{ [key: string]: number }>({});

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

  const usersAtPlace = useMemo(() => {
    if (!id) return [];
    const checkInUserIds = checkIns.filter(ci => ci.placeId === id).map(ci => ci.userId);
    return checkInUserIds
        .map(uid => userProfilesCache[uid])
        .filter(u => u && u.id !== currentUser?.id);
  }, [id, checkIns, userProfilesCache, currentUser?.id]);

  const loadSessionData = useCallback(async () => {
    if (!id || !currentUser) return;
    const table = await getActiveTableForUser(id);
    setActiveTable(table);
    fetchUsersForPlace(id);
    const vibes = await getVibesForPlace(id);
    setPlaceVibes(vibes);

    if (isCheckedInHere) {
      const order = getUserOrderForPlace(id, 'check-in');
      setConfirmationTicket({ type: 'check-in', timestamp: currentCheckIn?.timestamp || Date.now(), order });
    } else if (isGoingHere) {
      const specificIntention = goingIntentions.find((gi) => gi.userId === currentUser.id && gi.placeId === id);
      const order = getUserOrderForPlace(id, 'going');
      setConfirmationTicket({ type: 'going', timestamp: specificIntention?.timestamp || Date.now(), order });
    } else {
      setConfirmationTicket(null);
    }
    fetchActiveOrdersStatus();
  }, [id, currentUser, isCheckedInHere, isGoingHere, currentCheckIn, goingIntentions, getActiveTableForUser, getUserOrderForPlace, fetchActiveOrdersStatus, fetchUsersForPlace, getVibesForPlace]);

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

  const handleVibeReport = (vibe: string) => {
      if (!isCheckedInHere) {
          toast.error("Faça check-in primeiro!");
          return;
      }
      reportVibe(place.id, vibe);
      loadSessionData();
  };

  const userRecord = isCheckedInHere
    ? checkIns.find((ci) => ci.userId === currentUser?.id && ci.placeId === id)
    : goingIntentions.find((gi) => gi.userId === currentUser?.id && gi.placeId === id);

  const qrCodeValue = confirmationTicket && currentUser && userRecord
      ? `${currentUser.id}|${place.id}|${userRecord.createdAt}|${confirmationTicket.type}`
      : 'invalid';

  return (
    <div className="relative pb-24">
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

        {/* TOP VIBE INDICATOR */}
        {Object.keys(placeVibes).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
                {VIBE_OPTIONS.map(v => placeVibes[v.type] > 0 && (
                    <div key={v.type} className="flex items-center bg-gray-800 px-3 py-1 rounded-full border border-primary/20">
                        <span className="mr-1">{v.icon}</span>
                        <span className="text-[10px] font-black uppercase text-text-primary">{v.label}</span>
                    </div>
                ))}
            </div>
        )}

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

        {/* QUEM ESTÁ AQUI */}
        <WhoIsHere users={usersAtPlace} placeName={place.name} />

        {/* VIBE REPORTS ACTIONS */}
        {isCheckedInHere && (
            <div className="bg-surface p-4 rounded-xl border border-accent/20 mb-6">
                <h3 className="text-xs font-black uppercase text-text-secondary mb-3 flex items-center">
                    <Zap size={14} className="mr-1 text-accent" /> Como está a vibe por aí?
                </h3>
                <div className="flex justify-between">
                    {VIBE_OPTIONS.map(v => (
                        <button 
                            key={v.type} 
                            onClick={() => handleVibeReport(v.type)}
                            className="flex flex-col items-center group"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                {v.icon}
                            </div>
                            <span className="text-[8px] mt-1 font-bold text-text-secondary">{v.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* PROMOS SECTION */}
        {(activeGoingPromotions.length > 0 || activeCheckinPromotions.length > 0) && (
          <div className="mt-6 mb-6">
            <h2 className="text-2xl font-bold mb-3 flex items-center">
              <Ticket size={24} className="mr-2 text-accent" /> Promoções Ativas
            </h2>
            {[...activeGoingPromotions, ...activeCheckinPromotions].map((promo) => (
              <PromotionClaimStatus key={promo.id} promotion={promo} claim={getUserClaim(promo.id)} claimOrder={claimResult?.claimOrder} />
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-surface rounded-lg">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-full sm:w-1/2 space-y-3">
              {isCheckedInElsewhere && (
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <p className="font-semibold text-yellow-400">Check-in Ativo!</p>
                  <p className="text-sm text-text-secondary">Você já está em outro local. Faça check-out para realizar check-in aqui.</p>
                </div>
              )}
              <button
                onClick={handleAddGoingIntention} disabled={isGoingHere || isCheckedInHere}
                className="w-full bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-pink-600 transition-colors disabled:bg-gray-600 flex items-center justify-center text-sm"
              >
                <CalendarClock className="mr-2" size={18} /> {isGoingHere ? 'Já Marcou "Eu Vou"' : 'Eu Vou'}
              </button>
              <button
                onClick={handleCheckIn} disabled={!place.isOpen || isCheckedInHere || isCheckedInElsewhere}
                className="w-full bg-primary text-background font-bold py-2 px-4 rounded-lg hover:bg-pink-200 transition-colors disabled:bg-gray-600 flex items-center justify-center text-sm"
              >
                <Users className="mr-2" size={18} /> {isCheckedInHere ? 'Você está Aqui' : 'Estou Aqui'}
              </button>
            </div>
            <div className="w-full sm:w-1/2">
              {confirmationTicket && (
                <div className="flex flex-col items-center">
                  <ConfirmationTicket type={confirmationTicket.type} placeName={place.name} timestamp={confirmationTicket.timestamp} order={confirmationTicket.order} qrCodeValue={qrCodeValue} />
                  <button onClick={isCheckedInHere ? checkOutUser : () => removeGoingIntention(place.id)} className="mt-3 w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 flex items-center justify-center text-sm">
                    <XCircle className="mr-2" size={18} /> {isCheckedInHere ? 'Cancelar Check-in' : 'Cancelar Intenção'}
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
                <Clock size={16} className="mr-2 text-accent" /> <span>Seu post ficará visível por 1 hora.</span>
              </div>
              <LivePostForm onSubmit={handlePostSubmit} />
            </div>
          )}
          <LiveFeedBox place={place} showPlaceHeader={false} />
        </div>
      </div>

      <MapModal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} places={places} checkIns={checkIns} highlightedPlaceId={id} />
    </div>
  );
};

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
);

export default PlaceDetailsPage;