import React from 'react';
import { Promotion } from '../../types';
import { Calendar, Users, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OwnerPromotionCardProps {
    promotion: Promotion & { claim_count?: number; redeemed_count?: number };
    onDelete: (promotionId: string) => void;
}

const OwnerPromotionCard: React.FC<OwnerPromotionCardProps> = ({ promotion, onDelete }) => {
    const navigate = useNavigate();
    const now = new Date();
    const endDate = new Date(promotion.endDate);
    const isActive = endDate > now;
    const claimCount = promotion.claim_count || 0;
    const redeemedCount = promotion.redeemed_count || 0;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleDelete = () => {
        if (window.confirm(`Tem certeza que deseja excluir a promoção "${promotion.title}"? Esta ação não pode ser desfeita.`)) {
            onDelete(promotion.id);
        }
    };

    return (
        <div className="bg-surface p-4 rounded-lg border-l-4 border-accent">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-text-primary">{promotion.title}</h3>
                    <p className="text-sm text-text-secondary">{promotion.placeName}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/50 text-gray-400'}`}>
                        {isActive ? "Ativa" : "Expirada"}
                    </span>
                    <button onClick={() => navigate(`/owner/promotions/edit/${promotion.id}`)} className="p-1 text-text-secondary hover:text-primary" aria-label="Editar promoção">
                        <Edit size={16} />
                    </button>
                    <button onClick={handleDelete} className="p-1 text-text-secondary hover:text-red-500" aria-label="Excluir promoção">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            <p className="text-sm text-text-secondary mt-2">{promotion.description}</p>
            <div className="mt-4 pt-3 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <div className="flex items-center text-sm text-text-secondary">
                    <Calendar size={14} className="mr-2" />
                    <span>Expira em: {formatDate(promotion.endDate)}</span>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center font-semibold text-sm text-text-secondary">
                        <Users size={14} className="mr-2 text-primary" />
                        <span>{claimCount} / {promotion.limitCount} Reivindicados</span>
                    </div>
                    <div className="flex items-center font-semibold text-sm text-text-secondary">
                        <CheckCircle size={14} className="mr-2 text-green-400" />
                        <span>{redeemedCount} Confirmados</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerPromotionCard;