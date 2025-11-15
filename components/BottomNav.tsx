
import React from 'react';
import { NavLink } from 'react-router-dom';
import { MapPin, Sparkles, MessageSquare, User as UserIcon } from 'lucide-react';

const navItems = [
    { to: '/', icon: MapPin, label: 'Locais' },
    { to: '/match', icon: Sparkles, label: 'Match' },
    { to: '/chats', icon: MessageSquare, label: 'Conversas' },
    { to: '/profile', icon: UserIcon, label: 'Perfil' },
];

const BottomNav: React.FC = () => {
    const activeLinkClass = 'text-primary';
    const inactiveLinkClass = 'text-text-secondary hover:text-text-primary';

    return (
        <nav className="absolute bottom-0 left-0 right-0 h-16 bg-surface border-t border-gray-700 flex justify-around items-center max-w-md mx-auto">
            {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                    key={to}
                    to={to}
                    end // `end` prop is important for the root route '/'
                    className={({ isActive }) => 
                        `flex flex-col items-center justify-center w-1/4 transition-colors duration-200 ${isActive ? activeLinkClass : inactiveLinkClass}`
                    }
                >
                    <Icon size={24} />
                    <span className="text-xs mt-1">{label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;
