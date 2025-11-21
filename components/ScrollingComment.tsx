import React from 'react';
import { User } from '../types';
import { LivePost } from '../context/AppContext';

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
    const userProfile = post.profiles;

    return (
        <div className="flex items-start space-x-3 p-3 border-b border-gray-700/50 last:border-b-0">
            <img 
                src={userProfile?.photos?.[0] || 'https://i.pravatar.cc/150'} 
                alt={userProfile?.name} 
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-grow">
                <div className="flex items-baseline space-x-2">
                    <p className="font-semibold text-sm text-text-primary truncate">{userProfile?.name || 'Usuário'}</p>
                    <p className="text-xs text-text-secondary flex-shrink-0">{timeAgo(new Date(post.created_at))}</p>
                </div>
                <p className="text-sm text-text-secondary">{post.content}</p>
            </div>
        </div>
    );
};

export default ScrollingComment;