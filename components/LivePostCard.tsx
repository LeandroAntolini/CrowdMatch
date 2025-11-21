import React from 'react';
import { User } from '../types';

// Função para formatar o tempo relativo
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

interface LivePost {
    id: string;
    content: string;
    created_at: string;
    profiles: Pick<User, 'name' | 'photos'>;
}

interface LivePostCardProps {
    post: LivePost;
}

const LivePostCard: React.FC<LivePostCardProps> = ({ post }) => {
    const userProfile = post.profiles;

    return (
        <div className="bg-surface p-4 rounded-lg flex space-x-4">
            <img 
                src={userProfile?.photos?.[0] || 'https://i.pravatar.cc/150'} 
                alt={userProfile?.name} 
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-grow">
                <div className="flex items-baseline space-x-2">
                    <p className="font-bold text-text-primary">{userProfile?.name || 'Usuário'}</p>
                    <p className="text-xs text-text-secondary">{timeAgo(new Date(post.created_at))} atrás</p>
                </div>
                <p className="text-text-primary whitespace-pre-wrap">{post.content}</p>
            </div>
        </div>
    );
};

export default LivePostCard;