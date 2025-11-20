import React from 'react';
import { Ticket } from 'lucide-react';

const PromotionsPage: React.FC = () => {
    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-4">Promoções e Eventos</h1>
            <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary mt-16">
                <Ticket size={64} className="text-primary mb-4" />
                <h2 className="text-2xl font-semibold text-text-primary">Em Breve!</h2>
                <p className="mt-2">Fique de olho nesta página para promoções exclusivas e os melhores eventos da sua cidade.</p>
                <p className="mt-1 text-sm">Estabelecimentos interessados em anunciar, entrem em contato.</p>
            </div>
        </div>
    );
};

export default PromotionsPage;