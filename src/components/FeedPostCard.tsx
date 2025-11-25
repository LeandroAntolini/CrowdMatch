import React from 'react';
import { FeedPost } from '../types';
import { Heart, MessageCircle, Send } from 'lucide-react';
import ScrollingComment from './ScrollingComment'; // Reutilizando o componente de comentário

const FeedPostCard: React.FC<{ post: FeedPost }> = ({ post }) => {
    const renderMedia = () => {
        if (post.type === 'video') {
            return (
                <video
                    src={post.mediaUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                />
            );
        }
        if (post.type === 'live-highlight' && post.livePosts) {
            return (
                <div className="relative w-full h-full">
                    <img src={post.mediaUrl} alt={post.placeName} className="w-full h-full object-cover brightness-50" />
                    <div className="absolute inset-0 flex flex-col justify-center p-4 overflow-hidden">
                        <div className="h-full overflow-y-auto no-scrollbar space-y-2">
                            {post.livePosts.map(livePost => (
                                <div key={livePost.id} className="bg-black/50 p-2 rounded-lg">
                                    <div className="flex items-start space-x-2">
                                        <img src={livePost.profiles.photos[0]} alt={livePost.profiles.name} className="w-8 h-8 rounded-full object-cover" />
                                        <div>
                                            <p className="font-semibold text-sm text-white">{livePost.profiles.name}</p>
                                            <p className="text-sm text-gray-200">{livePost.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        return <img src={post.mediaUrl} alt={post.placeName} className="w-full h-full object-cover" />;
    };

    return (
        <div className="bg-surface rounded-lg overflow-hidden mb-6">
            {/* Header */}
            <div className="flex items-center p-3">
                <img src={post.placeLogoUrl} alt={`${post.placeName} logo`} className="w-10 h-10 rounded-full object-cover mr-3" />
                <span className="font-bold text-text-primary">{post.placeName}</span>
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

                <p className="text-xs text-text-secondary uppercase mt-3">{post.timestamp}</p>
            </div>
        </div>
    );
};

export default FeedPostCard;