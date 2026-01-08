import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building, LogOut } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const OwnerHeader: React.FC = () => {
    const { logout } = useAppContext();
    const location = useLocation();
    const navigate = useNavigate();

    const getTitle = () => {
        switch (location.pathname) {
            case '/dashboard':
                return 'Dashboard';
            case '/owner/tables':
                return 'Gestão de Mesas';
            case '/owner/menu':
                return 'Cardápio Digital';
            case '/owner/promotions':
                return 'Minhas Promoções';
            case '/owner/feeds':
                return 'Minhas Postagens';
            case '/owner/profile':
                return 'Perfil do Negócio';
            default:
                return 'Painel do Lojista';
        }
    };

    return (
        <header className="flex-shrink-0 w-full h-16 bg-background flex justify-between items-center px-4 border-b border-gray-800">
            <button 
                onClick={() => navigate('/owner/profile')} 
                className="p-2 text-text-secondary hover:text-primary"
                aria-label="Perfil do Negócio"
            >
                <Building size={28} />
            </button>

            <h1 className="text-xl font-bold text-text-primary">{getTitle()}</h1>

            <button 
                onClick={logout} 
                className="p-2 text-text-secondary hover:text-red-500"
                aria-label="Sair"
            >
                <LogOut size={28} />
            </button>
        </header>
    );
};

export default OwnerHeader;