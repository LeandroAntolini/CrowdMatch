import React from 'react';
import { Ticket, Clock, MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const PromotionCard: React.FC<{ promotion: any }> = ({ promotion }) => {
    const { promotionClaims, currentUser } = useAppContext();
    const userClaim = promotionClaims.find(c => c.promotionId === promotion.id);
    
    const isClaimed = !!userClaim;
    // Simplificamos a verificação de vencedor para a UI, confiando que o status 'claimed'
    // significa que o usuário tem um registro válido para resgate.
    const isWinner = isClaimed && userClaim.status === 'claimed'; 

    const getStatusText = () => {
        if (!currentUser) return 'Faça login para participar';
        if (isClaimed) {
            return isWinner ? 'Reivindicado! Você ganhou!' : 'Reivindicado (Limite atingido)';
        }
        return 'Participe agora!';
    };

    const statusClass = isClaimed 
        ? (isWinner ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400')
        : 'bg-accent/20 text-accent';

    return (
        <Link to={`/place/${promotion.placeId}`} className="block bg-surface rounded-lg p-4 mb-4 shadow-md hover:bg-gray-700 transition-all duration-200">
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
                <div className={`px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${statusClass}`}>
                    {getStatusText()}
                </div>
            </div>
        </Link>
    );
};

const PromotionsPage: React.FC = () => {
    const { promotions, isLoading } = useAppContext();

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
                        <PromotionCard key={promo.id} promotion={promo} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PromotionsPage;