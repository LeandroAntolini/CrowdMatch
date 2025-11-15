
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
import BottomNav from './components/BottomNav';

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
                <main className="h-full w-full max-w-md mx-auto relative flex flex-col">
                    <div className="flex-grow overflow-y-auto pb-16">
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
            </div>
        </HashRouter>
    );
};


export default App;
