import React from 'react';
import { NavLink } from 'react-router-dom';
import { MapPin, Sparkles, MessageSquare, User as UserIcon, Ticket } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const navItems = [
    { to: '/', icon: MapPin, label: 'Locais' },
    { to: '/promotions', icon: Ticket, label: 'Promoções' },
    { to: '/match', icon: Sparkles, label: 'Match' },
    { to: '/chats', icon: MessageSquare, label: 'Conversas' },
    { to: '/profile', icon: UserIcon, label: 'Perfil' },
];

const BottomNav: React.FC = () => {
    const { hasNewNotification } = useAppContext();
    const activeLinkClass = 'text-primary';
    const inactiveLinkClass = 'text-text-secondary hover:text-text-primary';

    return (
        <nav className="flex-shrink-0 w-full h-16 bg-surface border-t border-gray-700 flex justify-around items-center">
            {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={to === '/'} // `end` prop is important for the root route '/'
                    className={({ isActive }) => 
                        `relative flex flex-col items-center justify-center flex-1 transition-colors duration-200 ${isActive ? activeLinkClass : inactiveLinkClass}`
                    }
                >
                    <Icon size={24} />
                    <span className="text-xs mt-1">{label}</span>
                    {hasNewNotification && to === '/chats' && (
                        <span className="absolute top-1 right-[calc(50%-20px)] w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface"></span>
                    )}
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;