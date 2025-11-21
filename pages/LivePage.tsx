import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import LivePostForm from '../components/LivePostForm';
import LivePostCard from '../components/LivePostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Radio, ChevronDown } from 'lucide-react';
import { Place } from '../types';

const LivePage: React.FC = () => {
    const { 
        places,
        getCurrentCheckIn, 
        livePosts, 
        fetchLivePosts, 
        createLivePost 
    } = useAppContext();
    
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentCheckIn = getCurrentCheckIn();
    const checkedInPlace = currentCheckIn ? places.find(p => p.id === currentCheckIn.placeId) : null;

    // Define o local do check-in como padrão na primeira vez que a página carrega
    useEffect(() => {
        if (checkedInPlace && !selectedPlace) {
            setSelectedPlace(checkedInPlace);
        }
    }, [checkedInPlace, selectedPlace]);

    // Busca os posts sempre que um novo local é selecionado
    useEffect(() => {
        if (selectedPlace) {
            setIsLoading(true);
            fetchLivePosts(selectedPlace.id).finally(() => setIsLoading(false));
        } else {
            // Limpa os posts se nenhum local estiver selecionado
            fetchLivePosts(''); 
        }
    }, [selectedPlace, fetchLivePosts]);

    // Fecha o dropdown se clicar fora dele
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePostSubmit = async (content: string) => {
        if (selectedPlace) {
            await createLivePost(selectedPlace.id, content);
        }
    };

    const canPost = currentCheckIn?.placeId === selectedPlace?.id;

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-4">Feed Ao Vivo</h1>
            
            <div className="relative mb-6" ref={dropdownRef}>
                <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between bg-surface px-4 py-3 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                    <span className="truncate">{selectedPlace ? selectedPlace.name : 'Selecione um local para ver o feed'}</span>
                    <ChevronDown size={20} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                    <ul className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto no-scrollbar">
                        {places.length > 0 ? places.map(place => (
                            <li 
                                key={place.id} 
                                onClick={() => { setSelectedPlace(place); setIsDropdownOpen(false); }} 
                                className="px-4 py-2 hover:bg-accent hover:text-white cursor-pointer"
                            >
                                {place.name}
                            </li>
                        )) : <li className="px-4 py-2 text-text-secondary">Nenhum local encontrado.</li>}
                    </ul>
                )}
            </div>

            {!selectedPlace ? (
                <div className="flex flex-col items-center justify-center text-center p-4 mt-8">
                    <Radio size={48} className="text-primary mb-4" />
                    <p className="text-text-secondary">Selecione um local acima para ver o que está acontecendo em tempo real.</p>
                </div>
            ) : (
                <div>
                    {canPost && <LivePostForm onSubmit={handlePostSubmit} />}
                    
                    {isLoading ? (
                        <LoadingSpinner message={`Carregando feed de ${selectedPlace.name}...`} />
                    ) : (
                        <div className="space-y-4">
                            {livePosts.length > 0 ? (
                                livePosts.map(post => <LivePostCard key={post.id} post={post} />)
                            ) : (
                                <p className="text-center text-text-secondary mt-8">
                                    Ninguém comentou ainda em {selectedPlace.name}. 
                                    {canPost ? ' Seja o primeiro!' : ''}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LivePage;