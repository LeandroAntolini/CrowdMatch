import React, { useMemo } from 'react';
import { User } from '../types';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WhoIsHereProps {
    users: User[];
    placeName: string;
}

const WhoIsHere: React.FC<WhoIsHereProps> = ({ users, placeName }) => {
    const displayUsers = useMemo(() => users.slice(0, 5), [users]);
    const remainingCount = users.length > 5 ? users.length - 5 : 0;

    if (users.length === 0) return null;

    return (
        <div className="bg-secondary p-4 rounded-2xl border border-border-subtle mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase text-text-secondary tracking-widest flex items-center">
                    <Users size={14} className="mr-2 text-primary" />
                    Pessoas no Local
                </h3>
            </div>

            <div className="flex items-center">
                <div className="flex -space-x-3 mr-4">
                    {displayUsers.map((user) => (
                        <div key={user.id} className="relative group">
                            <img 
                                src={user.photos[0]} 
                                alt={user.name} 
                                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-border-subtle"
                                title={user.name}
                            />
                            {user.isAvailableForMatch && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                            )}
                        </div>
                    ))}
                    {remainingCount > 0 && (
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-white flex items-center justify-center text-[10px] font-black text-text-secondary shadow-sm ring-1 ring-border-subtle">
                            +{remainingCount}
                        </div>
                    )}
                </div>
                
                <div className="flex-grow">
                    <p className="text-xs text-text-primary font-medium leading-tight">
                        {users.length} {users.length === 1 ? 'pessoa está' : 'pessoas estão'} aqui.
                    </p>
                    <Link to="/match" className="text-[10px] font-black text-primary uppercase tracking-widest mt-1 inline-block hover:underline">
                        Conecte-se agora →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default WhoIsHere;