import React from 'react';
import { Promotion, PromotionClaim } from '../types';
import { CheckCircle, Clock, Ticket } from 'lucide-react';

interface PromotionClaimStatusProps {
    promotion: Promotion;
    claim?: PromotionClaim;
}

const PromotionClaimStatus: React.FC<PromotionClaimStatusProps> = ({ promotion, claim }) => {
    const isClaimed = !!claim;

    const getStatusDisplay = () => {
        if (!isClaimed) {
            return (
                <div className="flex items-center text-sm text-text-secondary">
                    <Clock size={16} className="mr-2 text-yellow-400" />
                    <span>Ação necessária para reivindicar.</span>
                </div>
            );
        }

        if (claim.status === 'redeemed') {
            return (
                <div className="flex items-center text-sm text-green-400 font-semibold">
                    <CheckCircle size={16} className="mr-2" />
                    <span>Resgatado! Aproveite.</span>
                </div>
            );
        }
        
        // Se o status for 'claimed', o usuário reivindicou e é um potencial vencedor.
        return (
            <div className="flex items-center text-sm text-primary font-semibold">
                <Ticket size={16} className="mr-2" />
                <span>Reivindicado! Mostre este status no caixa.</span>
            </div>
        );
    };

    return (
        <div className="bg-gray-800 p-3 rounded-lg border border-accent/50 mb-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary">{promotion.title}</h3>
                <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                    {promotion.promotionType === 'FIRST_N_GOING' ? 'Primeiros a Ir' : 'Primeiros a Checar'}
                </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">{promotion.description}</p>
            <p className="text-xs text-text-secondary mt-2">Limite: {promotion.limitCount} pessoas.</p>
            
            <div className="mt-3 pt-3 border-t border-gray-700">
                {getStatusDisplay()}
            </div>
        </div>
    );
};

export default PromotionClaimStatus;