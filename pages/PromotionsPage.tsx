import React, { useState, useEffect } from 'react';
import { Ticket, Clock, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import PromotionClaimStatus from '../components/PromotionClaimStatus';
import { Promotion, PromotionClaim } from '../types';

interface PromotionCardProps {
    promotion: Promotion;
    userClaim?: PromotionClaim;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, userClaim }) => {
    const { claimPromotion } = useAppContext();
    const [detailedClaimOrder, setDetailedClaimOrder] = useState<number | undefined>(undefined);
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);

    const isClaimed = !!userClaim;
    const isLimitReached = (promotion.currentClaimCount || 0) >= promotion.limitCount;

    useEffect(() => {
        // Se o usuário reivindicou, mas não temos a ordem detalhada (acontece na lista),
        // chamamos a função de reivindicação novamente. Ela é idempotente e retorna o status.
        if (isClaimed && detailedClaimOrder === undefined) {
            setIsLoadingStatus(true);
            claimPromotion(promotion.id)
                .then(result => {
                    if (result?.claimOrder !== undefined) {
                        setDetailedClaimOrder(result.claimOrder);
                    }
                })
                .catch(console.error)
                .finally(() => setIsLoadingStatus(false));
        }
    }, [isClaimed, detailedClaimOrder, promotion.id, claimPromotion]);

    if (isLoadingStatus) {
        return (
            <div className="flex items-center p-4 mb-4 bg-surface rounded-lg">
                <Loader2 size={20} className="animate-spin mr-3 text-accent" />
                <span className="text-text-secondary">Verificando status...</span>
            </div>
        );
    }
    
    // Se não foi reivindicado e o limite foi atingido, exibe o aviso de esgotado.
    if (!isClaimed && isLimitReached) {
        return (
            <div className="block mb-4">
                <div className="bg-gray-800 rounded-lg p-4 shadow-md border-l-4 border-red-500/50">
                    <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 rounded-md bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={32} className="text-red-400" />
                        </div>
                        <div className="flex-grow">
                            <h3 className="font-bold text-lg text-text-primary">{promotion.title}</h3>
                            <p className="text-sm text-red-400 mt-1 font-semibold">ESGOTADO!</p>
                            <p className="text-xs text-text-secondary mt-1">O limite de {promotion.limitCount} participantes já foi atingido.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Link to={`/place/${promotion.placeId}`} className="block mb-4">
            <div className="bg-surface rounded-lg p-4 shadow-md hover:bg-gray-700 transition-all duration-200">
                <div className="flex items-start space-x-4">
                    <img src={promotion.placePhotoUrl || 'https://picsum.photos/seed/promo/100/100'} alt={promotion.placeName} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                    <div className="flex-grow">
                        <h3 className="font-bold text-lg text-text-primary">{promotion.title}</h3>
                        <p className="text-sm text-text-secondary mt-1">{promotion.description}</p>
                        <div className="flex items-center text-xs mt-2 space-x-3">
                            <div className="flex items-center text-text-secondary">
                                <MapPin size={14} className="mr-1 text-primary" />
                                <span>{promotion.placeName}</span>
                            </div>
                            <div className="flex items-center text-text-secondary">
                                <Clock size={14} className="mr-1 text-accent" />
                                <span>Limite: {promotion.limitCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Exibe o status detalhado na parte inferior do card */}
                <div className="mt-3 pt-3 border-t border-gray-700">
                    <PromotionClaimStatus 
                        promotion={promotion} 
                        claim={userClaim} 
                        claimOrder={detailedClaimOrder} 
                    />
                </div>
            </div>
        </Link>
    );
};

const PromotionsPage: React.FC = () => {
    const { promotions, isLoading, promotionClaims } = useAppContext();

    if (isLoading) {
        return <LoadingSpinner message="Carregando promoções..." />;
    }

    const activePromotions = promotions.filter(p => new Date(p.endDate) > new Date(p.startDate));

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-4">Promoções Exclusivas</h1>
            
            {activePromotions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary mt-16">
                    <Ticket size={64} className="text-primary mb-4" />
                    <h2 className="text-2xl font-semibold text-text-primary">Nenhuma Promoção Ativa</h2>
                    <p className="mt-2">Fique de olho nesta página para promoções exclusivas e os melhores eventos da sua cidade.</p>
                </div>
            ) : (
                <div>
                    {activePromotions.map(promo => (
                        <PromotionCard 
                            key={promo.id} 
                            promotion={promo} 
                            userClaim={promotionClaims.find(c => c.promotionId === promo.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PromotionsPage;