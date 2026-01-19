import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Star, Users, CalendarClock, XCircle, Heart, Radio, Clock, Ticket, Utensils, Zap, ChevronLeft } from 'lucide-react';
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

  if (!place) return <LoadingSpinner />;

  const isNightlife = place?.category === 'Boate' || place?.category === 'Casa de Shows' || place?.category === 'Espaço Musical';
  const labelSingular = isNightlife ? 'Comanda' : 'Mesa';
  const menuLink = activeTable !== null ? `/menu/${place.id}/${activeTable}` : `/menu/${place.id}`;
  const menuButtonText = activeTable !== null ? `${labelSingular} ${activeTable}` : 'Cardápio Digital';

  // HANDLERS
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

  const handleAddGoing = async () => {
    if (!id) return;
    await addGoingIntention(id);
    await loadSessionData();
    let lastClaimResult: ClaimResultState | null = null;
    for (const promo of activeGoingPromotions) {
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

  const handleFavoriteToggle = () => {
      if (!id) return;
      if (isCurrentlyFavorite) removeFavorite(id);
      else addFavorite(id);
  };

  const userRecord = isCheckedInHere
    ? checkIns.find((ci) => ci.userId === currentUser?.id && ci.placeId === id)
    : goingIntentions.find((gi) => gi.userId === currentUser?.id && gi.placeId === id);

  const qrCodeValue = confirmationTicket && currentUser && userRecord
      ? `${currentUser.id}|${place.id}|${userRecord.createdAt}|${confirmationTicket.type}`
      : 'invalid';

  return (
    <div className="relative pb-24 bg-white min-h-full">
      <div className="relative h-72">
        <img src={place.photoUrl} alt={place.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10"></div>
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow-lg text-text-primary">
          <ChevronLeft size={24} />
        </button>
        <button onClick={handleFavoriteToggle} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg transition-colors">
          <Heart size={24} fill={isCurrentlyFavorite ? '#EC4899' : 'none'} stroke={isCurrentlyFavorite ? '#EC4899' : 'currentColor'} />
        </button>
      </div>

      <div className="px-4 -mt-6 relative">
        <div className="bg-white rounded-t-3xl p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] border-x border-t border-border-subtle">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h1 className="text-3xl font-black text-text-primary tracking-tighter">{place.name}</h1>
                    <p className="text-text-secondary font-medium text-sm">{place.category} &bull; {place.city}</p>
                </div>
                <div className="bg-primary/10 px-3 py-1 rounded-full flex items-center">
                    <Star size={14} className="text-primary fill-primary mr-1" />
                    <span className="text-primary font-black text-xs">{place.rating.toFixed(1)}</span>
                </div>
            </div>

            <div className="flex items-center space-x-6 my-6">
                <div className="text-center">
                    <p className="text-xl font-black text-text-primary">{crowdCount}</p>
                    <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Presentes</p>
                </div>
                <div className="w-px h-8 bg-border-subtle"></div>
                <div className="text-center">
                    <p className="text-xl font-black text-text-primary">{goingCount}</p>
                    <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Vão</p>
                </div>
                <div className="w-px h-8 bg-border-subtle"></div>
                <div className="text-center">
                    <p className="text-xl font-black text-text-primary">{getLivePostCount(place.id)}</p>
                    <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Live</p>
                </div>
            </div>

            {Object.keys(placeVibes).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {VIBE_OPTIONS.map(v => placeVibes[v.type] > 0 && (
                        <div key={v.type} className="flex items-center bg-secondary px-3 py-1 rounded-lg border border-border-subtle">
                            <span className="mr-1.5">{v.icon}</span>
                            <span className="text-[10px] font-black uppercase text-text-primary">{v.label}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-3 mb-6">
                <Link to={menuLink} className="flex-1 bg-text-primary text-white font-bold py-3 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                    <Utensils size={18} className="mr-2" /> {menuButtonText}
                </Link>
                <button onClick={() => setIsMapModalOpen(true)} className="w-14 h-14 bg-secondary border border-border-subtle rounded-xl flex items-center justify-center text-text-primary active:bg-border-subtle transition-colors">
                    <MapPin size={24} />
                </button>
            </div>

            <WhoIsHere users={usersAtPlace} placeName={place.name} />

            {isCheckedInHere && (
                <div className="bg-secondary p-5 rounded-2xl border border-border-subtle mb-8">
                    <h3 className="text-xs font-black uppercase text-text-secondary mb-4 flex items-center tracking-widest">
                        <Zap size={14} className="mr-2 text-accent" /> Como está a vibe por aí?
                    </h3>
                    <div className="flex justify-between">
                        {VIBE_OPTIONS.map(v => (
                            <button key={v.type} onClick={() => handleVibeReport(v.type)} className="flex flex-col items-center group">
                                <div className="w-12 h-12 rounded-full bg-white border border-border-subtle flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-sm">
                                    {v.icon}
                                </div>
                                <span className="text-[9px] mt-1.5 font-black text-text-secondary uppercase">{v.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {(activeGoingPromotions.length > 0 || activeCheckinPromotions.length > 0) && (
                <div className="mb-8">
                    <h2 className="text-xs font-black uppercase text-text-secondary mb-4 tracking-[0.2em] flex items-center">
                        <Ticket size={16} className="mr-2 text-accent" /> Promoções Exclusivas
                    </h2>
                    {[...activeGoingPromotions, ...activeCheckinPromotions].map((promo) => (
                        <PromotionClaimStatus key={promo.id} promotion={promo} claim={promotionClaims.find(c => c.promotionId === promo.id)} claimOrder={claimResult?.claimOrder} />
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 mb-10">
                {!isCheckedInHere && !isCheckedInElsewhere && (
                    <button onClick={handleCheckIn} className="w-full bg-primary text-white font-black py-4 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-primary/20 active:scale-95 transition-all">
                        <Users className="mr-2" size={20} /> Estou Aqui Agora
                    </button>
                )}
                {!isGoingHere && !isCheckedInHere && (
                    <button onClick={handleAddGoing} className="w-full bg-white border-2 border-accent text-accent font-black py-4 rounded-2xl flex items-center justify-center active:scale-95 transition-all">
                        <CalendarClock className="mr-2" size={20} /> Marcar "Eu Vou"
                    </button>
                )}

                {isCheckedInElsewhere && (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-600 text-center">
                        <p className="font-bold text-sm">Check-in em outro local!</p>
                        <p className="text-xs opacity-80">Faça check-out para entrar aqui.</p>
                    </div>
                )}
            </div>

            {confirmationTicket && (
                <div className="mb-10 animate-fade-in-up">
                    <ConfirmationTicket type={confirmationTicket.type} placeName={place.name} timestamp={confirmationTicket.timestamp} order={confirmationTicket.order} qrCodeValue={qrCodeValue} />
                    <button onClick={isCheckedInHere ? checkOutUser : () => removeGoingIntention(place.id)} className="mt-4 w-full text-red-500 font-bold text-sm flex items-center justify-center hover:underline">
                        <XCircle size={16} className="mr-1.5" /> {isCheckedInHere ? 'Sair do Local' : 'Cancelar Intenção'}
                    </button>
                </div>
            )}

            <div>
                <h2 className="text-xs font-black uppercase text-text-secondary mb-4 tracking-[0.2em] flex items-center">
                    <Radio size={16} className="mr-2 text-primary" /> Feed Ao Vivo do Local
                </h2>
                {isCheckedInHere && (
                    <div className="mb-6">
                        <LivePostForm onSubmit={(c) => createLivePost(place.id, c)} />
                    </div>
                )}
                <LiveFeedBox place={place} showPlaceHeader={false} />
            </div>
        </div>
      </div>

      <MapModal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} places={places} checkIns={checkIns} highlightedPlaceId={id} />
    </div>
  );
};

export default PlaceDetailsPage;