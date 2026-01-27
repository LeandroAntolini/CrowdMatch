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
            case '/': return 'Feeds';
            case '/places': return 'Locais';
            case '/promotions': return 'Promoções';
            case '/match': return 'Match';
            case '/live': return 'Ao Vivo';
            case '/chats': return 'Conversas';
            case '/profile': return 'Perfil';
            default: return 'CrowdMatch';
        }
    };

    const isProfilePage = location.pathname === '/profile';
    const isChatRelatedPage = location.pathname.startsWith('/chats') || location.pathname.startsWith('/chat/');

    return (
        <>
            <header className="flex-shrink-0 w-full h-14 bg-white flex justify-between items-center px-4 border-b border-border-subtle sticky top-0 z-[100]">
                <div className="flex items-center space-x-1">
                    <button 
                        onClick={() => isProfilePage ? navigate(-1) : navigate('/profile')} 
                        className={`p-2 transition-colors ${isProfilePage ? 'text-text-primary' : 'text-text-primary/70 hover:text-text-primary'}`}
                    >
                        <UserIcon size={24} />
                    </button>
                    <button 
                        onClick={() => isChatRelatedPage ? navigate(-1) : navigate('/chats')} 
                        className={`relative p-2 transition-colors ${isChatRelatedPage ? 'text-text-primary' : 'text-text-primary/70 hover:text-text-primary'}`}
                    >
                        <MessageSquare size={24} />
                        {hasNewNotification && !isChatRelatedPage && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                </div>

                <h1 className="text-lg font-bold text-text-primary tracking-tight">{getTitle()}</h1>

                <div className="flex items-center space-x-1">
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="p-2 text-text-primary/70 hover:text-text-primary transition-colors"
                        title="Escanear Mesa"
                    >
                        <QrCode size={24} />
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