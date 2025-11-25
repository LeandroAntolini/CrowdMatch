import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import OwnerDashboardPage from '../pages/owner/OwnerDashboardPage';
import OwnerProfilePage from '../pages/owner/OwnerProfilePage';
import PromotionsPage from '../pages/PromotionsPage'; // Reutilizável
import OwnerFeedsPage from '../pages/owner/OwnerFeedsPage';
import CreateFeedPostPage from '../pages/owner/CreateFeedPostPage';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerBottomNav from '../components/owner/OwnerBottomNav';

const OwnerLayout: React.FC = () => {
    return (
        <div className="h-full w-full max-w-md mx-auto flex flex-col">
            <OwnerHeader />
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <Routes>
                    <Route path="/dashboard" element={<OwnerDashboardPage />} />
                    <Route path="/owner/feeds" element={<OwnerFeedsPage />} />
                    <Route path="/owner/create-post" element={<CreateFeedPostPage />} />
                    <Route path="/owner/promotions" element={<PromotionsPage />} />
                    <Route path="/owner/profile" element={<OwnerProfilePage />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </div>
            <OwnerBottomNav />
        </div>
    );
};

export default OwnerLayout;