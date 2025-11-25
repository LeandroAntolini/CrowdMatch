import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, PlusCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Place } from '../../types';
import { brazilianStates, citiesByState } from '../../data/locations';

interface AddPlaceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddPlaceModal: React.FC<AddPlaceModalProps> = ({ isOpen, onClose }) => {
    const { currentUser, searchPlaces, addOwnedPlace, ownedPlaceIds } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Place[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedState, setSelectedState] = useState<string>(currentUser?.state || 'ES');
    const [selectedCity, setSelectedCity] = useState<string>(currentUser?.city || 'Vitória');
    const [availableCities, setAvailableCities] = useState<string[]>(citiesByState[selectedState] || []);

    useEffect(() => {
        const newCities = citiesByState[selectedState] || [];
        setAvailableCities(newCities);
        if (!newCities.includes(selectedCity)) {
            setSelectedCity(newCities[0] || '');
        }
    }, [selectedState, selectedCity]);

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedState(e.target.value);
    };

    const handleSearch = async () => {
        if (!selectedCity || !selectedState) {
            setError("Por favor, selecione um estado e uma cidade para a busca.");
            return;
        }
        if (!searchQuery.trim()) {
            setError("Por favor, digite o nome do estabelecimento.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const results = await searchPlaces(selectedCity, selectedState, searchQuery);
            setSearchResults(results);
        } catch (err: any) {
            setError(err.message || "Ocorreu um erro ao buscar. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPlace = async (place: Place) => {
        try {
            await addOwnedPlace(place);
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
                    Selecione a localização e busque pelo nome do seu estabelecimento. Se não encontrar, verifique se o local está cadastrado no Google Maps.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="state-select" className="block text-sm font-medium text-text-secondary mb-1">Estado</label>
                        <select
                            id="state-select"
                            value={selectedState}
                            onChange={handleStateChange}
                            className="w-full px-3 py-2 text-text-primary bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                            {brazilianStates.map(s => <option key={s.abbr} value={s.abbr}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="city-select" className="block text-sm font-medium text-text-secondary mb-1">Cidade</label>
                        <select
                            id="city-select"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            disabled={availableCities.length === 0}
                            className="w-full px-3 py-2 text-text-primary bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-gray-900"
                        >
                            {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

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
                        !isLoading && <p className="text-center text-text-secondary mt-8">Nenhum resultado. Digite sua busca acima.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddPlaceModal;