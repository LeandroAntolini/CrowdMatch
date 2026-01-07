import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User as UserIcon, MessageSquare, QrCode } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import MenuQrScannerModal from './MenuQrScannerModal';

const Header: React.FC = () => {
    const { hasNewNotification } = useAppContext();
    const location = useLocation();
    const navigate = useNavigate();
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const getTitle = () => {
        switch (location.pathname) {
            case '/':
                return 'Feeds';
            case '/places':
                return 'Locais';
            case '/promotions':
                return 'Promoções';
            case '/match':
                return 'Match';
            case '/live':
                return 'Ao Vivo';
            case '/chats':
                return 'Conversas';
            case '/profile':
                return 'Perfil';
            default:
                return 'CrowdMatch';
        }
    };

    const isProfilePage = location.pathname === '/profile';
    const isChatRelatedPage = location.pathname.startsWith('/chats') || location.pathname.startsWith('/chat/');

    const handleProfileClick = () => {
        if (isProfilePage) {
            navigate(-1); 
        } else {
            navigate('/profile');
        }
    };

    const handleChatClick = () => {
        if (isChatRelatedPage) {
            navigate(-1);
        } else {
            navigate('/chats');
        }
    };

    return (
        <>
            <header className="flex-shrink-0 w-full h-16 bg-background flex justify-between items-center px-4 border-b border-gray-800">
                <button 
                    onClick={handleProfileClick} 
                    className={`p-2 transition-colors ${isProfilePage ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}
                    aria-label={isProfilePage ? 'Fechar Perfil' : 'Abrir Perfil'}
                >
                    <UserIcon size={28} />
                </button>

                <h1 className="text-xl font-bold text-text-primary">{getTitle()}</h1>

                <div className="flex items-center space-x-1">
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="p-2 text-text-secondary hover:text-accent transition-colors"
                        aria-label="Escanear Mesa"
                    >
                        <QrCode size={26} />
                    </button>

                    <button 
                        onClick={handleChatClick} 
                        className={`relative p-2 transition-colors ${isChatRelatedPage ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}
                        aria-label={isChatRelatedPage ? 'Fechar Conversas' : 'Abrir Conversas'}
                    >
                        <MessageSquare size={28} />
                        {hasNewNotification && !isChatRelatedPage && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface"></span>
                        )}
                    </button>
                </div>
            </header>

            <MenuQrScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
            />
        </>
    );
};

export default Header;