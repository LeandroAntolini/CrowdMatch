import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ticket, Newspaper, Building } from 'lucide-react';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/owner/feeds', icon: Newspaper, label: 'Feeds' },
    { to: 'owner/promotions', icon: Ticket, label: 'Promoções' },
    { to: '/owner/profile', icon: Building, label: 'Perfil' },
];

const OwnerBottomNav: React.FC = () => {
    const activeLinkClass = 'text-primary';
    const inactiveLinkClass = 'text-text-secondary hover:text-text-primary';

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
                    <span className="text-xs mt-1">{label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default OwnerBottomNav;