import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { Promotion } from '../types';

const PromotionCard: React.FC<{ promotion: Promotion }> = ({ promotion }) => {
    const endDate = new Date(promotion.end_date);
    const formattedEndDate = `Válido até ${endDate.toLocaleDateString('pt-BR')}`;

    return (
        <Link to={`/place/${promotion.place_id}`} className="block bg-surface rounded-lg mb-4 shadow-md hover:bg-gray-700 transition-all duration-200 overflow-hidden">
            <img src={promotion.place_photo_url} alt={promotion.place_name} className="w-full h-40 object-cover" />
            <div className="p-4">
                <h3 className="font-bold text-lg text-accent">{promotion.title}</h3>
                <p className="text-sm text-text-primary font-semibold mt-1">{promotion.place_name}</p>
                <p className="text-sm text-text-secondary mt-2">{promotion.description}</p>
                <p className="text-xs text-text-secondary mt-3">{formattedEndDate}</p>
            </div>
        </Link>
    );
};

const PromotionsPage: React.FC = () => {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPromotions = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('promotions')
                .select('*')
                .gte('end_date', new Date().toISOString()) // Apenas promoções ativas
                .order('end_date', { ascending: true });

            if (error) {
                console.error("Error fetching promotions:", error);
            } else {
                setPromotions(data as Promotion[]);
            }
            setLoading(false);
        };

        fetchPromotions();
    }, []);

    if (loading) {
        return <LoadingSpinner message="Buscando promoções..." />;
    }

    return (
        <div className="p-4">
            {promotions.length > 0 ? (
                promotions.map(promo => <PromotionCard key={promo.id} promotion={promo} />)
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary mt-16">
                    <Ticket size={64} className="text-primary mb-4" />
                    <h2 className="text-2xl font-semibold text-text-primary">Nenhuma promoção ativa no momento.</h2>
                    <p className="mt-2">Fique de olho! Novas ofertas podem aparecer a qualquer momento.</p>
                </div>
            )}
        </div>
    );
};

export default PromotionsPage;