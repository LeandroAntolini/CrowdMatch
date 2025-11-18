import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const ChatListPage: React.FC = () => {
    const { matches } = useAppContext();

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-4">Matches & Conversas</h1>
            {matches.length === 0 ? (
                <p className="text-text-secondary text-center mt-8">Nenhum match ainda. Vá encontrar alguns!</p>
            ) : (
                <div>
                    {matches.map(match => {
                        const otherUser = match.otherUser;
                        if (!otherUser) return null;

                        return (
                            <Link to={`/chat/${match.id}`} key={match.id} className="flex items-center p-3 bg-surface rounded-lg mb-3 hover:bg-gray-700 transition-colors">
                                <img src={otherUser.photos[0]} alt={otherUser.name} className="w-14 h-14 rounded-full object-cover mr-4" />
                                <div className="flex-grow">
                                    <h3 className="font-semibold text-text-primary">{otherUser.name}</h3>
                                    <p className="text-sm text-text-secondary truncate">{match.lastMessage}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ChatListPage;