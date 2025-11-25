import React from 'react';
import { useAppContext } from '../../context/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Ticket, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OwnerPromotionCard from '../../components/owner/OwnerPromotionCard';

const OwnerPromotionsPage: React.FC = () => {
    const { ownerPromotions, isLoading, deletePromotion } = useAppContext();
    const navigate = useNavigate();

    const handleDelete = async (promotionId: string) => {
        try {
            await deletePromotion(promotionId);
        } catch (error: any) {
            alert(`Erro ao excluir promoção: ${error.message}`);
        }
    };

    if (isLoading) {
        return <LoadingSpinner message="Carregando suas promoções..." />;
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Minhas Promoções</h1>
                <button 
                    onClick={() => navigate('/owner/promotions/create')}
                    className="flex items-center justify-center bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-pink-600 transition-colors"
                >
                    <Plus size={18} className="mr-2" />
                    Criar Nova
                </button>
            </div>

            {ownerPromotions.length === 0 ? (
                <div className="text-center text-text-secondary mt-16">
                    <Ticket size={48} className="mx-auto text-primary mb-4" />
                    <p className="text-lg font-semibold">Nenhuma promoção criada.</p>
                    <p className="text-sm mt-2">Clique em "Criar Nova" para começar a atrair clientes.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {ownerPromotions.map(promo => (
                        <OwnerPromotionCard key={promo.id} promotion={promo} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OwnerPromotionsPage;