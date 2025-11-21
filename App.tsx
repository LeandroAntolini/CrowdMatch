import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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

const App: React.FC = () => {
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

const AppContent: React.FC = () => {
    const { isAuthenticated, hasOnboarded } = useAppContext();

    return (
        <HashRouter>
            <div className="h-screen w-screen bg-background text-text-primary font-sans overflow-hidden">
                <main className="h-full w-full max-w-md mx-auto flex flex-col">
                    {/* O conteúdo principal (rotas) agora ocupa o espaço restante e é o único a rolar */}
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
                    {/* BottomNav fica fora do contêiner de rolagem, fixo na parte inferior */}
                    {isAuthenticated && <BottomNav />}
                </main>
                {isAuthenticated && <MatchNotificationModal />}
            </div>
        </HashRouter>
    );
};


export default App;