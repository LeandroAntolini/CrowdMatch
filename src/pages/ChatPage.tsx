import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Send } from 'lucide-react';
import { Message } from '../types';
import { supabase } from '../integrations/supabase/client'; // Caminho atualizado
import LoadingSpinner from '../components/LoadingSpinner';

const ChatPage: React.FC = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const navigate = useNavigate();
    const { currentUser, matches, sendMessage } = useAppContext();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const match = matches.find(m => m.id === matchId);
    const otherUser = match?.otherUser;

    useEffect(() => {
        const fetchMessages = async () => {
            if (!matchId) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('match_id', matchId)
                .order('created_at', { ascending: true });
            
            if (error) {
                console.error("Error fetching messages:", error);
            } else {
                const formattedMessages: Message[] = data.map(m => ({
                    id: m.id,
                    matchId: m.match_id,
                    senderId: m.sender_id,
                    content: m.content,
                    createdAt: m.created_at,
                }));
                setMessages(formattedMessages);
            }
            setLoading(false);
        };

        fetchMessages();
    }, [matchId]);

    useEffect(() => {
        if (!matchId) return;

        const channel = supabase.channel(`chat:${matchId}`)
            .on<Message>(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
                (payload) => {
                    const newMessageData = payload.new as any;
                     const formattedMessage: Message = {
                        id: newMessageData.id,
                        matchId: newMessageData.match_id,
                        senderId: newMessageData.sender_id,
                        content: newMessageData.content,
                        createdAt: newMessageData.created_at,
                    };
                    setMessages((prevMessages) => [...prevMessages, formattedMessage]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [matchId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!currentUser || !match || !otherUser) {
        return <div className="p-4">Match não encontrado.</div>;
    }

    const handleSend = async () => {
        if (newMessage.trim() && matchId) {
            await sendMessage(matchId, newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center p-3 bg-surface border-b border-gray-700 sticky top-0">
                <button onClick={() => navigate(-1)} className="mr-3 p-1">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                </button>
                <img src={otherUser.photos[0]} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover mr-3" />
                <h2 className="font-bold text-lg">{otherUser.name}</h2>
            </header>

            <div className="flex-grow p-4 overflow-y-auto">
                {loading ? <LoadingSpinner /> : (
                    messages.map((message) => (
                        <div key={message.id} className={`flex mb-4 ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs px-4 py-2 rounded-2xl ${message.senderId === currentUser.id ? 'bg-accent text-white rounded-br-none' : 'bg-surface text-text-primary rounded-bl-none'}`}>
                                {message.content}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-surface border-t border-gray-700">
                <div className="flex items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite uma mensagem..."
                        className="flex-grow bg-gray-800 text-text-primary px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button onClick={handleSend} className="ml-3 bg-accent text-white p-3 rounded-full">
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;