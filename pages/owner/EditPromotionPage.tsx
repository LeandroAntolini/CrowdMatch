import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PromotionForm from '../../components/owner/PromotionForm';
import { useAppContext } from '../../context/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft } from 'lucide-react';

const EditPromotionPage: React.FC = () => {
    const { promotionId } = useParams<{ promotionId: string }>();
    const { ownerPromotions, isLoading } = useAppContext();
    const navigate = useNavigate();

    const promotionToEdit = ownerPromotions.find(p => p.id === promotionId);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!promotionToEdit) {
        return <div className="p-6 text-center">Promoção não encontrada.</div>;
    }

    return (
        <div className="p-6">
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-surface">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold">Editar Promoção</h1>
                    <p className="text-text-secondary">
                        Ajuste os detalhes da sua promoção.
                    </p>
                </div>
            </div>
            <PromotionForm existingPromotion={promotionToEdit} />
        </div>
    );
};

export default EditPromotionPage;