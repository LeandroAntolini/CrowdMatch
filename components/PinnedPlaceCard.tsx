import React from 'react';
import { Link } from 'react-router-dom';
import { Place } from '../types';
import { CalendarClock, CheckCircle, XCircle } from 'lucide-react';

interface PinnedPlaceCardProps {
    place: Place;
    type: 'check-in' | 'going';
    onCancel: () => void;
}

const PinnedPlaceCard: React.FC<PinnedPlaceCardProps> = ({ place, type, onCancel }) => {
    const isCheckIn = type === 'check-in';
    const borderColor = isCheckIn ? 'border-primary' : 'border-accent';
    const Icon = isCheckIn ? CheckCircle : CalendarClock;
    const statusText = isCheckIn ? 'Você está aqui' : 'Você marcou "Eu Vou"';

    return (
        <div className={`bg-gray-800 rounded-lg mb-4 border-l-4 ${borderColor} shadow-lg`}>
            <div className="p-4 flex items-center space-x-4">
                <Link to={`/place/${place.id}`} className="flex items-center space-x-4 flex-grow">
                    <img src={place.photoUrl} alt={place.name} className="w-16 h-16 rounded-md object-cover" />
                    <div className="flex-grow">
                        <div className="flex items-center text-sm font-semibold text-white mb-1">
                            <Icon size={16} className={`mr-2 ${isCheckIn ? 'text-primary' : 'text-accent'}`} />
                            <span>{statusText}</span>
                        </div>
                        <h3 className="font-bold text-lg text-text-primary">{place.name}</h3>
                        <p className="text-sm text-text-secondary">{place.category}</p>
                    </div>
                </Link>
                <button 
                    onClick={onCancel}
                    className="flex flex-col items-center text-red-500 hover:text-red-400 transition-colors p-2"
                    aria-label={isCheckIn ? 'Cancelar Check-in' : 'Cancelar Intenção'}
                >
                    <XCircle size={24} />
                    <span className="text-xs mt-1">Cancelar</span>
                </button>
            </div>
        </div>
    );
};

export default PinnedPlaceCard;