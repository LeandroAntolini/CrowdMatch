import React from 'react';
import PromotionForm from '../../components/owner/PromotionForm';

const CreatePromotionPage: React.FC = () => {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-2">Criar Nova Promoção</h1>
            <p className="text-text-secondary mb-6">
                Preencha os detalhes abaixo para lançar uma nova promoção para um de seus locais.
            </p>
            <PromotionForm />
        </div>
    );
};

export default CreatePromotionPage;