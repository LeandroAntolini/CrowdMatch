import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import OnboardingPage from './pages/OnboardingPage';
import AuthPage from './pages/AuthPage';
import UserLayout from './layouts/UserLayout';
import OwnerLayout from './layouts/OwnerLayout';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    return (
        <AppProvider>
            <HashRouter>
                <AppRoutes />
            </HashRouter>
        </AppProvider>
    );
};

const AppRoutes: React.FC = () => {
    const { isAuthenticated, hasOnboarded, currentUser, isLoading } = useAppContext();

    if (isLoading && hasOnboarded) {
        return (
            <div className="h-screen w-screen bg-background flex items-center justify-center">
                <LoadingSpinner message="Carregando sua sessão..." />
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-background text-text-primary font-sans overflow-hidden">
            <main className="h-full w-full">
                <Routes>
                    {!hasOnboarded ? (
                        <>
                            <Route path="/" element={<OnboardingPage />} />
                            <Route path="*" element={<Navigate to="/" />} />
                        </>
                    ) : !isAuthenticated ? (
                        <>
                            <Route path="/auth" element={<AuthPage />} />
                            <Route path="*" element={<Navigate to="/auth" />} />
                        </>
                    ) : currentUser?.role === 'owner' ? (
                        <Route path="/*" element={<OwnerLayout />} />
                    ) : (
                        <Route path="/*" element={<UserLayout />} />
                    )}
                </Routes>
            </main>
        </div>
    );
};

export default App;