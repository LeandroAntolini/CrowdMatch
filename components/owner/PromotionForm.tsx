import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Place, Promotion, PromotionType } from '../../types';

interface PromotionFormProps {
    existingPromotion?: Promotion;
}

const PromotionForm: React.FC<PromotionFormProps> = ({ existingPromotion }) => {
    const { createPromotion, updatePromotion, ownedPlaceIds, getPlaceById, places } = useAppContext();
    const navigate = useNavigate();
    const isEditMode = !!existingPromotion;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [placeId, setPlaceId] = useState('');
    const [promotionType, setPromotionType] = useState<PromotionType>('FIRST_N_CHECKIN');
    const [limitCount, setLimitCount] = useState(10);
    const [endDate, setEndDate] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const ownedPlacesDetails = useMemo(() => {
        return ownedPlaceIds
            .map(id => getPlaceById(id))
            .filter((p): p is Place => p !== undefined);
    }, [ownedPlaceIds, places, getPlaceById]);

    useEffect(() => {
        if (existingPromotion) {
            setTitle(existingPromotion.title);
            setDescription(existingPromotion.description || '');
            setPlaceId(existingPromotion.placeId);
            setPromotionType(existingPromotion.promotionType);
            setLimitCount(existingPromotion.limitCount);
            // Formata a data para o input datetime-local
            const localDate = new Date(existingPromotion.endDate);
            localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
            setEndDate(localDate.toISOString().slice(0, 16));
        } else if (ownedPlacesDetails.length > 0 && !placeId) {
            setPlaceId(ownedPlacesDetails[0].id);
        }
    }, [existingPromotion, ownedPlacesDetails, placeId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !placeId || !endDate) {
            setError("Título, local e data de término são obrigatórios.");
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            if (isEditMode && existingPromotion) {
                await updatePromotion(existingPromotion.id, {
                    title,
                    description,
                    promotionType,
                    limitCount,
                    endDate,
                });
            } else {
                const place = getPlaceById(placeId);
                if (!place) throw new Error("Local selecionado não é válido.");

                await createPromotion({
                    title,
                    description,
                    placeId,
                    placeName: place.name,
                    placePhotoUrl: place.photoUrl,
                    promotionType,
                    limitCount,
                    startDate: new Date().toISOString(),
                    endDate: new Date(endDate).toISOString(),
                });
            }
            navigate('/owner/promotions');
        } catch (err: any) {
            setError(err.message || `Ocorreu um erro ao ${isEditMode ? 'atualizar' : 'criar'} a promoção.`);
        } finally {
            setIsLoading(false);
        }
    };

    if (ownedPlacesDetails.length === 0) {
        return <p className="text-text-secondary">Você precisa adicionar um local ao seu perfil antes de criar uma promoção.</p>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-surface p-6 rounded-lg">
            <div>
                <label htmlFor="placeId" className="block text-sm font-medium text-text-secondary mb-1">Estabelecimento</label>
                <select
                    id="placeId"
                    value={placeId}
                    onChange={(e) => setPlaceId(e.target.value)}
                    disabled={isEditMode}
                    className="w-full px-3 py-2 text-text-primary bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-gray-900 disabled:cursor-not-allowed"
                >
                    {ownedPlacesDetails.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">Título da Promoção</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Drink em Dobro"
                    className="w-full px-3 py-2 text-text-primary bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Descrição (Opcional)</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Ex: Na compra de um gin tônica, o segundo é por nossa conta."
                    className="w-full px-3 py-2 text-text-primary bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="promotionType" className="block text-sm font-medium text-text-secondary mb-1">Tipo de Promoção</label>
                    <select
                        id="promotionType"
                        value={promotionType}
                        onChange={(e) => setPromotionType(e.target.value as PromotionType)}
                        disabled={isEditMode}
                        className="w-full px-3 py-2 text-text-primary bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-gray-900 disabled:cursor-not-allowed"
                    >
                        <option value="FIRST_N_CHECKIN">Para quem está AQUI</option>
                        <option value="FIRST_N_GOING">Para quem VAI</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="limitCount" className="block text-sm font-medium text-text-secondary mb-1">Limite de Pessoas</label>
                    <input
                        id="limitCount"
                        type="number"
                        value={limitCount}
                        onChange={(e) => setLimitCount(parseInt(e.target.value, 10))}
                        min="1"
                        className="w-full px-3 py-2 text-text-primary bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-text-secondary mb-1">Data de Término</label>
                <input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-text-primary bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center disabled:bg-gray-600"
            >
                {isLoading ? <Loader2 size={20} className="animate-spin mr-2" /> : null}
                {isLoading ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Criar Promoção'}
            </button>
        </form>
    );
};

export default PromotionForm;