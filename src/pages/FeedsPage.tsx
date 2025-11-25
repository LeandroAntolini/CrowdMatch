import React from 'react';
import { mockFeedData } from '../data/mockFeedData';
import FeedPostCard from '../components/FeedPostCard';

const FeedsPage: React.FC = () => {
    return (
        <div className="p-4">
            {mockFeedData.map(post => (
                <FeedPostCard key={post.id} post={post} />
            ))}
        </div>
    );
};

export default FeedsPage;