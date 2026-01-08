import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User as UserIcon, MessageSquare, QrCode, Receipt } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import MenuQrScannerModal from './MenuQrScannerModal';
import ComandaOverlay from './ComandaOverlay';
import { Order } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';

const Header: React.FC = () => {
    const { hasNewNotification, hasActiveOrders, activeOrderPlaceId, activeTableNumber, fetchActiveOrdersStatus } = useAppContext();
    const location = useLocation();
    const navigate = useNavigate();
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isComandaOpen, setIsComandaOpen] = useState(false);
    const [userOrders, setUserOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

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
    
    const handleOpenComanda = async () => {
        if (!hasActiveOrders || !activeOrderPlaceId) return;

        setLoadingOrders(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*, menu_items(*))')
                .eq('place_id', activeOrderPlaceId)
                .eq('user_id', supabase.auth.currentUser?.id)
                .not('status', 'in', '("paid", "cancelled")')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setUserOrders(data || []);
            setIsComandaOpen(true);
        } catch (e) {
            console.error("Erro ao buscar pedidos:", e);
            toast.error("Não foi possível carregar sua comanda.");
        } finally {
            setLoadingOrders(false);
        }
    };
    
    const handleDisabledClick = () => {
        toast.error("Escaneie o QR Code da mesa para ativar sua comanda digital.");
    };

    return (
        <>
            <header className="flex-shrink-0 w-full h-16 bg-background flex justify-between items-center px-4 border-b border-gray-800">
                {/* LADO ESQUERDO: Perfil e Chat */}
                <div className="flex items-center space-x-1">
                    <button 
                        onClick={handleProfileClick} 
                        className={`p-2 transition-colors ${isProfilePage ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}
                        aria-label={isProfilePage ? 'Fechar Perfil' : 'Abrir Perfil'}
                    >
                        <UserIcon size={28} />
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

                <h1 className="text-xl font-bold text-text-primary">{getTitle()}</h1>

                {/* LADO DIREITO: Comanda e Scanner QR */}
                <div className="flex items-center space-x-1">
                    <button 
                        onClick={hasActiveOrders ? handleOpenComanda : handleDisabledClick}
                        disabled={loadingOrders}
                        className={`relative p-2 transition-colors ${hasActiveOrders ? 'text-accent hover:text-pink-400' : 'text-gray-600 opacity-50 cursor-not-allowed'}`}
                        aria-label="Abrir Comanda"
                    >
                        <Receipt size={26} />
                        {hasActiveOrders && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface"></span>
                        )}
                    </button>
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="p-2 text-text-secondary hover:text-accent transition-colors"
                        aria-label="Escanear Mesa"
                    >
                        <QrCode size={26} />
                    </button>
                </div>
            </header>

            <MenuQrScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
            />
            
            <ComandaOverlay 
                isOpen={isComandaOpen} 
                onClose={() => { setIsComandaOpen(false); fetchActiveOrdersStatus(); }} 
                orders={userOrders} 
            />
        </>
    );
};

export default Header;