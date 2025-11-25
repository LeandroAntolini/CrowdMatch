import React from 'react';
import { FeedPost } from '../types';
import { Heart, MessageCircle, Send } from 'lucide-react';

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
                    <button className="text-text-primary hover:text-accent transition-colors"><Heart size={26} /></button>
                    <button className="text-text-primary hover:text-accent transition-colors"><MessageCircle size={26} /></button>
                    <button className="text-text-primary hover:text-accent transition-colors"><Send size={26} /></button>
                </div>

                <p className="font-bold text-text-primary">{post.likes.toLocaleString('pt-BR')} curtidas</p>

                <p className="text-text-primary mt-2">
                    <span className="font-bold mr-2">{post.placeName}</span>
                    {post.caption}
                </p>

                {post.comments.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {post.comments.map((comment, index) => (
                            <p key={index} className="text-sm text-text-secondary">
                                <span className="font-semibold text-text-primary mr-2">{comment.user}</span>
                                {comment.text}
                            </p>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedPostCard;