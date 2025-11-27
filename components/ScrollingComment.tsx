import React, { useState } from 'react';
import { LivePost, useAppContext } from '../context/AppContext';
import { MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react';
import EditLivePostModal from './EditLivePostModal';

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h atrás";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min atrás";
    return "agora";
};

interface ScrollingCommentProps {
    post: LivePost;
}

const ScrollingComment: React.FC<ScrollingCommentProps> = ({ post }) => {
    const { getPlaceById, currentUser, updateLivePost, deleteLivePost } = useAppContext();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const userProfile = post.profiles;
    const place = getPlaceById(post.place_id);
    const isOwnerPost = userProfile?.role === 'owner';
    const isMyPost = currentUser?.id === post.user_id;

    const displayName = isOwnerPost ? place?.name : userProfile?.name;
    const displayPhoto = isOwnerPost ? place?.photoUrl : userProfile?.photos?.[0];
    const nameSuffix = isOwnerPost ? ' (Estabelecimento)' : '';

    const handleUpdate = async (newContent: string) => {
        try {
            await updateLivePost(post.id, newContent);
        } catch (e) {
            alert(`Erro ao editar: ${(e as Error).message}`);
            throw e;
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Tem certeza que deseja apagar este post?")) return;
        setIsDeleting(true);
        try {
            await deleteLivePost(post.id, post.place_id);
        } catch (e) {
            alert(`Erro ao apagar: ${(e as Error).message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="flex items-start space-x-3 p-3 border-b border-gray-700/50 last:border-b-0">
                <img 
                    src={displayPhoto || 'https://i.pravatar.cc/150'} 
                    alt={displayName || 'Usuário'} 
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-baseline space-x-2">
                                <p className="font-semibold text-sm text-text-primary truncate">{displayName || 'Usuário'}{nameSuffix}</p>
                                <p className="text-xs text-text-secondary flex-shrink-0">{timeAgo(new Date(post.created_at))}</p>
                            </div>
                            <p className="text-sm text-text-secondary">{post.content}</p>
                        </div>
                        {isMyPost && (
                            <div className="relative">
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-text-secondary hover:text-white p-1">
                                    <MoreVertical size={18} />
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

export default ScrollingComment;