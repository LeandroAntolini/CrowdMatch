import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainPage from '../pages/MainPage';
import PlaceDetailsPage from '../pages/PlaceDetailsPage';
import MatchPage from '../pages/MatchPage';
import ChatListPage from '../pages/ChatListPage';
import ChatPage from '../pages/ChatPage';
import ProfilePage from '../pages/ProfilePage';
import PromotionsPage from '../pages/PromotionsPage';
import LivePage from '../pages/LivePage';
import FeedsPage from '../pages/FeedsPage';
import BottomNav from '../components/BottomNav';
import MatchNotificationModal from '../components/MatchNotificationModal';
import Header from '../components/Header';

const UserLayout: React.FC = () => {
    const location = useLocation();
    const noHeaderRoutes = ['/place', '/chat/'];
    const showHeader = !noHeaderRoutes.some(path => location.pathname.startsWith(path));

    return (
        <div className="h-full w-full max-w-md mx-auto flex flex-col">
            {showHeader && <Header />}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <Routes>
                    <Route path="/feeds" element={<FeedsPage />} />
                    <Route path="/" element={<MainPage />} />
                    <Route path="/place/:id" element={<PlaceDetailsPage />} />
                    <Route path="/promotions" element={<PromotionsPage />} />
                    <Route path="/match" element={<MatchPage />} />
                    <Route path="/live" element={<LivePage />} />
                    <Route path="/chats" element={<ChatListPage />} />
                    <Route path="/chat/:matchId" element={<ChatPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
            <BottomNav />
            <MatchNotificationModal />
        </div>
    );
};

export default UserLayout;