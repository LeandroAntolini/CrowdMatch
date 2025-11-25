import React from 'react';
import { Promotion } from '../../types';
import { Calendar, Users, CheckCircle } from 'lucide-react';

const OwnerPromotionCard: React.FC<{ promotion: Promotion & { claim_count?: number } }> = ({ promotion }) => {
    const now = new Date();
    const endDate = new Date(promotion.endDate);
    const isActive = endDate > now;
    const claimCount = promotion.claim_count || 0;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-surface p-4 rounded-lg border-l-4 border-accent">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-text-primary">{promotion.title}</h3>
                    <p className="text-sm text-text-secondary">{promotion.placeName}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/50 text-gray-400'}`}>
                    {isActive ? "Ativa" : "Expirada"}
                </span>
            </div>
            <p className="text-sm text-text-secondary mt-2">{promotion.description}</p>
            <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center text-sm text-text-secondary">
                <div className="flex items-center">
                    <Calendar size={14} className="mr-2" />
                    <span>Expira em: {formatDate(promotion.endDate)}</span>
                </div>
                <div className="flex items-center font-semibold">
                    <Users size={14} className="mr-2 text-primary" />
                    <span>{claimCount} / {promotion.limitCount} Reivindicados</span>
                </div>
            </div>
        </div>
    );
};

export default OwnerPromotionCard;