import React, { useState } from 'react';
import { FeedPost, PostComment } from '../types';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

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

const CommentInput: React.FC<{ postId: string }> = ({ postId }) => {
    const { addCommentToPost } = useAppContext();
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!content.trim() || isSending) return;
        setIsSending(true);
        try {
            await addCommentToPost(postId, content.trim());
            setContent('');
        } catch (error) {
            console.error("Failed to add comment:", error);
            alert("Falha ao enviar comentário.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex items-center mt-3">
            <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Adicionar um comentário..."
                className="flex-grow bg-gray-800 text-text-primary px-3 py-1.5 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                disabled={isSending}
            />
            <button 
                onClick={handleSend} 
                disabled={!content.trim() || isSending}
                className="ml-2 text-accent disabled:text-gray-600"
            >
                <Send size={18} />
            </button>
        </div>
    );
};

const FeedPostCard: React.FC<{ post: FeedPost }> = ({ post }) => {
    const { likePost, unlikePost } = useAppContext();
    const [showComments, setShowComments] = useState(false);

    const handleLikeToggle = async () => {
        try {
            if (post.isLikedByCurrentUser) {
                await unlikePost(post.id);
            } else {
                await likePost(post.id);
            }
        } catch (error) {
            console.error("Failed to toggle like:", error);
            alert("Falha ao curtir/descurtir o post.");
        }
    };

    const renderMedia = () => {
        if (post.type === 'video') {
            return (
                <video
                    src={post.mediaUrl}
                    className="w-full h-full object-cover"
                    controls
                />
            );
        }
        return <img src={post.mediaUrl} alt={post.placeName} className="w-full h-full object-cover" />;
    };

    return (
        <div className="bg-surface rounded-lg overflow-hidden mb-6">
            {/* Header */}
            <div className="flex items-center p-3">
                <img src={post.placeLogoUrl || 'https://i.pravatar.cc/150?u=default'} alt={`${post.placeName} logo`} className="w-10 h-10 rounded-full object-cover mr-3" />
                <div>
                    <span className="font-bold text-text-primary">{post.placeName}</span>
                    <p className="text-xs text-text-secondary">{timeAgo(post.timestamp)}</p>
                </div>
            </div>

            {/* Media */}
            <div className="w-full aspect-square bg-gray-800">
                {renderMedia()}
            </div>

            {/* Actions & Content */}
            <div className="p-4">
                <div className="flex items-center space-x-4 mb-3">
                    <button onClick={handleLikeToggle} className="transition-colors flex items-center">
                        <Heart 
                            size={26} 
                            fill={post.isLikedByCurrentUser ? '#EC4899' : 'none'} 
                            stroke={post.isLikedByCurrentUser ? '#EC4899' : 'currentColor'} 
                            className={post.isLikedByCurrentUser ? 'text-accent' : 'text-text-primary hover:text-accent'}
                        />
                    </button>
                    <button onClick={() => setShowComments(!showComments)} className="text-text-primary hover:text-accent transition-colors flex items-center">
                        <MessageCircle size={26} />
                    </button>
                </div>

                {post.likes > 0 && (
                    <p className="font-bold text-text-primary text-sm">{post.likes.toLocaleString('pt-BR')} curtidas</p>
                )}

                <p className={`text-text-primary ${post.likes > 0 ? 'mt-2' : ''}`}>
                    <span className="font-bold mr-2">{post.placeName}</span>
                    {post.caption}
                </p>

                {/* Comments Section */}
                {showComments && (
                    <div className="mt-4 pt-2 border-t border-gray-700">
                        <h4 className="font-semibold text-sm text-text-primary mb-2">Comentários ({post.comments.length})</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                            {post.comments.map((comment: PostComment) => (
                                <p key={comment.id} className="text-sm text-text-secondary">
                                    <span className="font-semibold text-text-primary mr-2">{comment.profiles.name}</span>
                                    {comment.content}
                                </p>
                            ))}
                        </div>
                        <CommentInput postId={post.id} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedPostCard;