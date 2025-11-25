import React, { useState, useMemo } from 'react';
import { Building, Plus, Trash2, MapPin } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import AddPlaceModal from '../../components/owner/AddPlaceModal';
import { Place } from '../../types';

const OwnedPlaceCard: React.FC<{ place: Place; onRemove: (placeId: string) => void }> = ({ place, onRemove }) => {
    return (
        <div className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <img src={place.photoUrl} alt={place.name} className="w-16 h-16 rounded-md object-cover" />
                <div>
                    <h3 className="font-bold text-lg text-text-primary">{place.name}</h3>
                    <p className="text-sm text-text-secondary flex items-center">
                        <MapPin size={14} className="mr-1" />
                        {place.address}
                    </p>
                </div>
            </div>
            <button onClick={() => onRemove(place.id)} className="text-red-500 hover:text-red-400 p-2">
                <Trash2 size={20} />
            </button>
        </div>
    );
};

const OwnerProfilePage: React.FC = () => {
    const { ownedPlaceIds, getPlaceById, removeOwnedPlace, places } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const ownedPlacesDetails = useMemo(() => {
        // Mapeia os IDs para os detalhes completos dos locais
        const placeDetails = ownedPlaceIds
            .map(id => getPlaceById(id))
            .filter((p): p is Place => p !== undefined);
        
        // IDs de locais que foram encontrados nos detalhes
        const foundPlaceIds = new Set(placeDetails.map(p => p.id));

        // Adiciona objetos placeholder para locais cujos detalhes não foram carregados
        const placeholderPlaces = ownedPlaceIds
            .filter(id => !foundPlaceIds.has(id))
            .map(id => ({
                id: id,
                name: `Local (ID: ${id.substring(0, 6)}...)`,
                address: "Carregando detalhes...",
                photoUrl: "https://picsum.photos/seed/placeholder/100/100",
            } as Place));

        return [...placeDetails, ...placeholderPlaces];
    }, [ownedPlaceIds, places, getPlaceById]);

    const handleRemovePlace = async (placeId: string) => {
        if (window.confirm("Tem certeza que deseja remover este local da sua conta?")) {
            try {
                await removeOwnedPlace(placeId);
            } catch (error: any) {
                alert(`Erro ao remover o local: ${error.message}`);
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Meus Locais</h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-pink-600 transition-colors"
                >
                    <Plus size={18} className="mr-2" />
                    Adicionar Local
                </button>
            </div>
            
            <div className="bg-surface p-6 rounded-lg space-y-4">
                {ownedPlacesDetails.length > 0 ? (
                    ownedPlacesDetails.map(place => (
                        <OwnedPlaceCard key={place.id} place={place} onRemove={handleRemovePlace} />
                    ))
                ) : (
                    <div className="text-center text-text-secondary py-8">
                        <Building size={48} className="mx-auto text-primary mb-4" />
                        <p className="text-lg font-semibold">Nenhum local associado.</p>
                        <p className="text-sm mt-2">Clique em "Adicionar Local" para começar a gerenciar seus estabelecimentos.</p>
                    </div>
                )}
            </div>

            <AddPlaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default OwnerProfilePage;