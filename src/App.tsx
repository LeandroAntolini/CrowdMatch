import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import OnboardingPage from './pages/OnboardingPage';
import AuthPage from './pages/AuthPage';
import MainPage from './pages/MainPage';
import PlaceDetailsPage from './pages/PlaceDetailsPage';
import MatchPage from './pages/MatchPage';
import ChatListPage from './pages/ChatListPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import PromotionsPage from './pages/PromotionsPage';
import BottomNav from './components/BottomNav';
import MatchNotificationModal from './components/MatchNotificationModal';
import Header from './components/Header';

const App: React.FC = () => {
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    return (
        <AppProvider>
            <HashRouter>
                <Layout />
            </HashRouter>
        </AppProvider>
    );
};

const Layout: React.FC = () => {
    const { isAuthenticated, hasOnboarded } = useAppContext();
    const location = useLocation();

    const noHeaderRoutes = ['/place', '/chat/'];
    const showHeader = isAuthenticated && !noHeaderRoutes.some(path => location.pathname.startsWith(path));

    return (
        <div className="h-screen w-screen bg-background text-text-primary font-sans overflow-hidden">
            <main className="h-full w-full max-w-md mx-auto flex flex-col">
                {showHeader && <Header />}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <Routes>
                        {!hasOnboarded && <Route path="/" element={<OnboardingPage />} />}
                        {hasOnboarded && !isAuthenticated && (
                            <>
                                <Route path="/auth" element={<AuthPage />} />
                                <Route path="*" element={<Navigate to="/auth" />} />
                            </>
                        )}
                        {isAuthenticated && (
                            <>
                                <Route path="/" element={<MainPage />} />
                                <Route path="/place/:id" element={<PlaceDetailsPage />} />
                                <Route path="/promotions" element={<PromotionsPage />} />
                                <Route path="/match" element={<MatchPage />} />
                                <Route path="/chats" element={<ChatListPage />} />
                                <Route path="/chat/:matchId" element={<ChatPage />} />
                                <Route path="/profile" element={<ProfilePage />} />
                                <Route path="*" element={<Navigate to="/" />} />
                            </>
                        )}
                        {hasOnboarded && <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/auth"} />} />}
                    </Routes>
                </div>
                {isAuthenticated && <BottomNav />}
            </main>
            {isAuthenticated && <MatchNotificationModal />}
        </div>
    );
};

export default App;