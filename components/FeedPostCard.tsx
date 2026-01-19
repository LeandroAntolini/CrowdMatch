import React, { useState } from 'react';
import { FeedPost, PostComment } from '../types';
import { Beer, MessageCircle, Send, MoreHorizontal } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';

const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
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
    return "agora";
};

const FeedPostCard: React.FC<{ post: FeedPost }> = ({ post }) => {
    const { likePost, unlikePost, addCommentToPost } = useAppContext();
    const [content, setContent] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleLikeToggle = async () => {
        if (post.isLikedByCurrentUser) await unlikePost(post.id);
        else await likePost(post.id);
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        await addCommentToPost(post.id, content.trim());
        setContent('');
    };

    const commentsToShow = isExpanded ? post.comments : post.comments.slice(-2);

    return (
        <div className="bg-white border-b border-border-subtle mb-4">
            <header className="flex items-center justify-between p-3">
                <Link to={`/place/${post.placeId}`} className="flex items-center">
                    <img src={post.placeLogoUrl || 'https://i.pravatar.cc/150'} className="w-8 h-8 rounded-full object-cover mr-3 border border-border-subtle" />
                    <div>
                        <span className="font-bold text-sm text-text-primary">{post.placeName}</span>
                    </div>
                </Link>
                <MoreHorizontal size={18} className="text-text-secondary" />
            </header>

            <div className="w-full aspect-square bg-secondary overflow-hidden">
                {post.type === 'video' ? <video src={post.mediaUrl} className="w-full h-full object-cover" controls /> : <img src={post.mediaUrl} className="w-full h-full object-cover" />}
            </div>

            <div className="p-3 space-y-2">
                <div className="flex items-center space-x-4">
                    <button onClick={handleLikeToggle}>
                        <Beer size={24} className={post.isLikedByCurrentUser ? 'text-accent fill-accent' : 'text-text-primary'} />
                    </button>
                    <MessageCircle size={24} className="text-text-primary" />
                </div>

                {post.likes > 0 && <p className="font-bold text-sm">{post.likes.toLocaleString()} brindes</p>}

                <div className="text-sm">
                    <span className="font-bold mr-2">{post.placeName}</span>
                    <span className="text-text-primary">{post.caption}</span>
                </div>

                {post.comments.length > 0 && (
                    <div className="space-y-1">
                        {!isExpanded && post.comments.length > 2 && (
                            <button onClick={() => setIsExpanded(true)} className="text-xs text-text-secondary block py-1">Ver todos os {post.comments.length} comentários</button>
                        )}
                        {commentsToShow.map(c => (
                            <p key={c.id} className="text-xs"><span className="font-bold mr-2">{c.profiles.name}</span>{c.content}</p>
                        ))}
                    </div>
                )}
                
                <p className="text-[10px] text-text-secondary uppercase mt-1 tracking-tighter">{timeAgo(post.timestamp)} atrás</p>
            </div>

            <form onSubmit={handleComment} className="border-t border-border-subtle px-3 py-2 flex items-center">
                <input 
                    type="text" 
                    placeholder="Adicionar comentário..." 
                    className="flex-grow text-xs bg-transparent focus:outline-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <button type="submit" disabled={!content.trim()} className="text-primary font-bold text-xs disabled:opacity-30">Publicar</button>
            </form>
        </div>
    );
};

export default FeedPostCard;