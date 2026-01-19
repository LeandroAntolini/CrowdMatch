import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ticket, Building, Utensils, LayoutGrid, ClipboardList } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const OwnerBottomNav: React.FC = () => {
    const { ownedPlaceIds, getPlaceById } = useAppContext();
    const activeLinkClass = 'text-primary';
    const inactiveLinkClass = 'text-text-secondary hover:text-text-primary';

    const firstPlace = ownedPlaceIds.length > 0 ? getPlaceById(ownedPlaceIds[0]) : null;
    const isNightlife = firstPlace?.category === 'Boate' || firstPlace?.category === 'Casa de Shows' || firstPlace?.category === 'Espaço Musical';
    const labelAmbiente = isNightlife ? 'Comandas' : 'Mesas';

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
        { to: '/owner/tables', icon: LayoutGrid, label: labelAmbiente },
        { to: '/owner/orders', icon: ClipboardList, label: 'Pedidos' },
        { to: '/owner/menu', icon: Utensils, label: 'Cardápio' },
        { to: '/owner/profile', icon: Building, label: 'Perfil' },
    ];

    return (
        <nav className="flex-shrink-0 w-full h-16 bg-surface border-t border-gray-700 flex justify-around items-center">
            {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={to === '/dashboard'}
                    className={({ isActive }) => 
                        `relative flex flex-col items-center justify-center flex-1 transition-colors duration-200 ${isActive ? activeLinkClass : inactiveLinkClass}`
                    }
                >
                    <Icon size={24} />
                    <span className="text-[10px] mt-1">{label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default OwnerBottomNav;