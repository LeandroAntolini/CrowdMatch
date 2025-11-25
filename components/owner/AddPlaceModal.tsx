import React, { useState } from 'react';
import { X, Search, Loader2, PlusCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Place } from '../../types';

interface AddPlaceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddPlaceModal: React.FC<AddPlaceModalProps> = ({ isOpen, onClose }) => {
    const { currentUser, fetchPlaces, addOwnedPlace, ownedPlaceIds } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Place[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!searchQuery.trim() || !currentUser?.city || !currentUser?.state) {
            setError("Por favor, digite um termo de busca.");
            return;
        }
        setIsLoading(true);
        setError(null);
        const results = await fetchPlaces(currentUser.city, currentUser.state, searchQuery);
        setSearchResults(results);
        setIsLoading(false);
    };

    const handleAddPlace = async (place: Place) => {
        try {
            await addOwnedPlace(place.id);
            // Optionally show a success message before closing
            onClose();
        } catch (err: any) {
            setError(err.message || "Não foi possível adicionar o local.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-up">
            <div className="relative bg-surface rounded-2xl w-full max-w-lg text-left p-6 flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-text-primary">Adicionar Local</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <p className="text-text-secondary mb-4 text-sm">
                    Busque pelo nome do seu estabelecimento na sua cidade. Se não encontrar, verifique se o local está cadastrado no Google Maps.
                </p>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Ex: The Pub, Restaurante Maré..."
                        className="flex-grow bg-gray-800 text-text-primary px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button onClick={handleSearch} disabled={isLoading} className="bg-accent text-white font-bold p-3 rounded-lg hover:bg-pink-600 disabled:bg-gray-600">
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                    </button>
                </div>

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                <div className="flex-grow overflow-y-auto no-scrollbar pr-2">
                    {searchResults.length > 0 ? (
                        searchResults.map(place => (
                            <div key={place.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg mb-2">
                                <div className="flex items-center space-x-3">
                                    <img src={place.photoUrl} alt={place.name} className="w-12 h-12 rounded-md object-cover" />
                                    <div>
                                        <p className="font-semibold text-text-primary">{place.name}</p>
                                        <p className="text-xs text-text-secondary">{place.address}</p>
                                    </div>
                                </div>
                                {ownedPlaceIds.includes(place.id) ? (
                                    <span className="text-sm text-green-400">Adicionado</span>
                                ) : (
                                    <button onClick={() => handleAddPlace(place)} className="text-accent hover:text-pink-400">
                                        <PlusCircle size={24} />
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        !isLoading && <p className="text-center text-text-secondary mt-8">Nenhum resultado.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddPlaceModal;