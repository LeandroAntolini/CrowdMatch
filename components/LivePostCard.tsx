import React, { useState } from 'react';
import { LivePost, useAppContext } from '../context/AppContext';
import { MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react';
import EditLivePostModal from './EditLivePostModal';

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "a";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return Math.floor(seconds) + "s";
};

interface LivePostCardProps {
    post: LivePost;
}

const LivePostCard: React.FC<LivePostCardProps> = ({ post }) => {
    const { getPlaceById, currentUser, updateLivePost, deleteLivePost } = useAppContext();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const userProfile = post.profiles;
    const place = getPlaceById(post.place_id);
    const isOwnerPost = userProfile?.role === 'owner';
    const isMyPost = currentUser?.id === post.user_id;

    const displayName = isOwnerPost ? place?.name : userProfile?.name;
    const displayPhoto = isOwnerPost ? place?.photoUrl : userProfile?.photos?.[0];
    const nameSuffix = isOwnerPost ? ' (Estabelecimento)' : '';

    const handleUpdate = async (newContent: string) => {
        setError(null);
        try {
            await updateLivePost(post.id, newContent);
        } catch (e: any) {
            setError(e.message);
            // Re-throw to keep modal open if needed
            throw e;
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Tem certeza que deseja apagar este post?")) return;
        setIsDeleting(true);
        setError(null);
        try {
            await deleteLivePost(post.id, post.place_id);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="bg-surface p-4 rounded-lg flex space-x-4">
                <img 
                    src={displayPhoto || 'https://i.pravatar.cc/150'} 
                    alt={displayName || 'Usuário'} 
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-baseline space-x-2">
                                <p className="font-bold text-text-primary">{displayName || 'Usuário'}{nameSuffix}</p>
                                <p className="text-xs text-text-secondary">{timeAgo(new Date(post.created_at))} atrás</p>
                            </div>
                            <p className="text-text-primary whitespace-pre-wrap">{post.content}</p>
                        </div>
                        {isMyPost && (
                            <div className="relative">
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-text-secondary hover:text-white p-1">
                                    <MoreVertical size={20} />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                                        <button onClick={() => { setIsEditModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-text-primary hover:bg-accent">
                                            <Edit size={14} className="mr-2" /> Editar
                                        </button>
                                        <button onClick={handleDelete} disabled={isDeleting} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-600 hover:text-white">
                                            {isDeleting ? <Loader2 size={14} className="animate-spin mr-2" /> : <Trash2 size={14} className="mr-2" />}
                                            Apagar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                </div>
            </div>
            <EditLivePostModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                post={post}
                onSave={handleUpdate}
            />
        </>
    );
};

export default LivePostCard;