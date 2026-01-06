import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import OwnerDashboardPage from '../pages/owner/OwnerDashboardPage';
import OwnerProfilePage from '../pages/owner/OwnerProfilePage';
import OwnerPromotionsPage from '../pages/owner/OwnerPromotionsPage';
import CreatePromotionPage from '../pages/owner/CreatePromotionPage';
import EditPromotionPage from '../pages/owner/EditPromotionPage';
import OwnerFeedsPage from '../pages/owner/OwnerFeedsPage';
import CreateFeedPostPage from '../pages/owner/CreateFeedPostPage';
import CreateMediaPostPage from '../pages/owner/CreateMediaPostPage';
import CreateLiveRepostPage from '../pages/owner/CreateLiveRepostPage';
import VerifyQrPage from '../pages/owner/VerifyQrPage';
import OwnerLivePage from '../pages/owner/OwnerLivePage'; 
import MenuManagementPage from '../pages/owner/MenuManagementPage';
import OrderBoardPage from '../pages/owner/OrderBoardPage';
import TableQRManager from '../pages/owner/TableQRManager';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerBottomNav from '../components/owner/OwnerBottomNav';

const OwnerLayout: React.FC = () => {
    return (
        <div className="h-full w-full max-w-md mx-auto flex flex-col">
            <OwnerHeader />
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <Routes>
                    <Route path="/dashboard" element={<OwnerDashboardPage />} />
                    <Route path="/owner/orders" element={<OrderBoardPage />} />
                    <Route path="/owner/menu" element={<MenuManagementPage />} />
                    <Route path="/owner/qrs" element={<TableQRManager />} />
                    <Route path="/owner/feeds" element={<OwnerFeedsPage />} />
                    <Route path="/owner/create-post" element={<CreateFeedPostPage />} />
                    <Route path="/owner/create-media-post" element={<CreateMediaPostPage />} />
                    <Route path="/owner/create-live-repost" element={<CreateLiveRepostPage />} />
                    <Route path="/owner/promotions" element={<OwnerPromotionsPage />} />
                    <Route path="/owner/promotions/create" element={<CreatePromotionPage />} />
                    <Route path="/owner/promotions/edit/:promotionId" element={<EditPromotionPage />} />
                    <Route path="/owner/profile" element={<OwnerProfilePage />} />
                    <Route path="/owner/verify-qr" element={<VerifyQrPage />} />
                    <Route path="/owner/live" element={<OwnerLivePage />} /> 
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </div>
            <OwnerBottomNav />
        </div>
    );
};

export default OwnerLayout;