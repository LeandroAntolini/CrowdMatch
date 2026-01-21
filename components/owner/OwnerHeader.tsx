import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building, LogOut, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const OwnerHeader: React.FC = () => {
    const { logout, ownedPlaceIds, getPlaceById, activeOwnedPlaceId, setActiveOwnedPlaceId } = useAppContext();
    const location = useLocation();
    const navigate = useNavigate();

    const activePlace = activeOwnedPlaceId ? getPlaceById(activeOwnedPlaceId) : null;

    const getTitle = () => {
        switch (location.pathname) {
            case '/dashboard':
                return 'Dashboard';
            case '/owner/tables':
                return 'Mesas';
            case '/owner/orders':
                return 'Pedidos';
            case '/owner/menu':
                return 'Cardápio';
            case '/owner/promotions':
                return 'Promoções';
            case '/owner/feeds':
                return 'Postagens';
            case '/owner/profile':
                return 'Perfil';
            default:
                return 'Lojista';
        }
    };

    return (
        <header className="flex-shrink-0 w-full h-16 bg-white flex justify-between items-center px-4 border-b border-border-subtle sticky top-0 z-[100]">
            <div className="flex items-center flex-1 min-w-0">
                <button 
                    onClick={() => navigate('/owner/profile')} 
                    className="p-2 text-text-primary/70 hover:text-text-primary mr-2"
                >
                    <Building size={24} />
                </button>
                
                {ownedPlaceIds.length > 0 ? (
                    <div className="relative group max-w-[200px]">
                        <select 
                            value={activeOwnedPlaceId || ''}
                            onChange={(e) => setActiveOwnedPlaceId(e.target.value)}
                            className="appearance-none bg-secondary pl-3 pr-8 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest text-text-primary border border-border-subtle focus:outline-none cursor-pointer w-full truncate"
                        >
                            {ownedPlaceIds.map(id => (
                                <option key={id} value={id}>
                                    {getPlaceById(id)?.name || 'Carregando...'}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                    </div>
                ) : (
                    <span className="text-[10px] font-black uppercase text-text-secondary">Nenhum Local</span>
                )}
            </div>

            <div className="hidden sm:block text-center">
                <h1 className="text-sm font-black text-text-primary uppercase tracking-widest">{getTitle()}</h1>
            </div>

            <div className="flex-1 flex justify-end">
                <button 
                    onClick={logout} 
                    className="p-2 text-text-secondary hover:text-red-500 transition-colors"
                    aria-label="Sair"
                >
                    <LogOut size={24} />
                </button>
            </div>
        </header>
    );
};

export default OwnerHeader;