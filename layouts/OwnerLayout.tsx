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
        <div className="h-full w-full flex flex-col bg-background">
            <div className="flex-shrink-0 flex justify-center w-full border-b border-gray-800">
                <div className="w-full max-w-7xl">
                    <OwnerHeader />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar flex justify-center">
                <div className="w-full max-w-7xl">
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
            </div>

            <div className="flex-shrink-0 flex justify-center w-full border-t border-gray-700 bg-surface">
                <div className="w-full max-w-md">
                    <OwnerBottomNav />
                </div>
            </div>
        </div>
    );
};

export default OwnerLayout;