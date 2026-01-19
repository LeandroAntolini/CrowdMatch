import React from 'react';
import { NavLink } from 'react-router-dom';
import { MapPin, Sparkles, Ticket, Radio, Newspaper } from 'lucide-react';

const navItems = [
    { to: '/', icon: Newspaper, label: 'Feed' },
    { to: '/places', icon: MapPin, label: 'Explorar' },
    { to: '/promotions', icon: Ticket, label: 'Promos' },
    { to: '/match', icon: Sparkles, label: 'Match' },
    { to: '/live', icon: Radio, label: 'Ao Vivo' },
];

const BottomNav: React.FC = () => {
    return (
        <nav className="flex-shrink-0 w-full h-16 bg-white border-t border-border-subtle flex justify-around items-center px-2">
            {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) => 
                        `flex flex-col items-center justify-center flex-1 transition-all duration-200 ${isActive ? 'text-text-primary scale-110' : 'text-text-secondary hover:text-text-primary'}`
                    }
                >
                    {({ isActive }) => (
                        <>
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`text-[10px] mt-1 font-medium ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                                {label}
                            </span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;