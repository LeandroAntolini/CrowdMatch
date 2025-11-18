import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, X } from 'lucide-react';

const MatchNotificationModal: React.FC = () => {
    const { newlyFormedMatch, clearNewMatch, currentUser } = useAppContext();

    if (!newlyFormedMatch || !newlyFormedMatch.otherUser || !currentUser) {
        return null;
    }

    const { otherUser } = newlyFormedMatch;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative bg-surface rounded-2xl w-full max-w-sm text-center p-8 animate-fade-in-up">
                <button onClick={clearNewMatch} className="absolute top-2 right-2 text-text-secondary hover:text-white">
                    <X size={24} />
                </button>
                
                <h2 className="text-4xl font-bold text-primary mb-4">É um Match!</h2>
                <p className="text-text-secondary mb-6">Você e {otherUser.name} se curtiram.</p>

                <div className="flex items-center justify-center space-x-[-20px] mb-8">
                    <img src={currentUser.photos[0]} alt={currentUser.name} className="w-24 h-24 rounded-full object-cover border-4 border-accent" />
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center z-10">
                        <Heart className="text-white" size={24} />
                    </div>
                    <img src={otherUser.photos[0]} alt={otherUser.name} className="w-24 h-24 rounded-full object-cover border-4 border-accent" />
                </div>

                <div className="space-y-3">
                    <Link
                        to={`/chat/${newlyFormedMatch.id}`}
                        onClick={clearNewMatch}
                        className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center"
                    >
                        <MessageSquare size={20} className="mr-2" />
                        Enviar Mensagem
                    </Link>
                    <button
                        onClick={clearNewMatch}
                        className="w-full bg-gray-600 text-text-primary font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Continuar Navegando
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MatchNotificationModal;