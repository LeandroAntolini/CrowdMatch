import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import OnboardingPage from './pages/OnboardingPage';
import AuthPage from './pages/AuthPage';
import UserLayout from './layouts/UserLayout';
import OwnerLayout from './layouts/OwnerLayout';
import LoadingSpinner from './components/LoadingSpinner';
import MenuPage from './pages/MenuPage';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    return (
        <AppProvider>
            <HashRouter>
                <AppRoutes />
                <Toaster position="top-center" reverseOrder={false} />
            </HashRouter>
        </AppProvider>
    );
};

const AppRoutes: React.FC = () => {
    const { isAuthenticated, hasOnboarded, currentUser, isLoading, isAuthResolved } = useAppContext();

    if (!isAuthResolved) {
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
                    {/* Rotas de Cardápio são prioritárias e universais */}
                    <Route path="/menu/:placeId" element={<MenuPage />} />
                    <Route path="/menu/:placeId/:tableNumber" element={<MenuPage />} />

                    {/* Fluxo de Onboarding e Auth */}
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
                    ) : (
                        /* App Principal (Logado) */
                        <>
                            {isLoading ? (
                                <Route path="*" element={<div className="h-full flex items-center justify-center"><LoadingSpinner message="Sincronizando dados..." /></div>} />
                            ) : currentUser?.role === 'owner' ? (
                                <Route path="/*" element={<OwnerLayout />} />
                            ) : (
                                <Route path="/*" element={<UserLayout />} />
                            )}
                        </>
                    )}
                </Routes>
            </main>
        </div>
    );
};

export default App;