import React, { useMemo } from 'react';
import { User } from '../types';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WhoIsHereProps {
    users: User[];
    placeName: string;
}

const WhoIsHere: React.FC<WhoIsHereProps> = ({ users, placeName }) => {
    // Pegamos até 5 avatars para o stack visual, e o restante em texto
    const displayUsers = useMemo(() => users.slice(0, 5), [users]);
    const remainingCount = users.length > 5 ? users.length - 5 : 0;

    if (users.length === 0) return null;

    return (
        <div className="bg-surface p-4 rounded-xl border border-gray-800 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-text-primary flex items-center">
                    <Users size={18} className="mr-2 text-primary" />
                    Quem está aqui agora
                </h3>
                <span className="text-[10px] font-black uppercase text-text-secondary bg-gray-800 px-2 py-1 rounded-lg">
                    {users.length} presentes
                </span>
            </div>

            <div className="flex items-center">
                <div className="flex -space-x-3 mr-4">
                    {displayUsers.map((user) => (
                        <div key={user.id} className="relative group">
                            <img 
                                src={user.photos[0]} 
                                alt={user.name} 
                                className="w-10 h-10 rounded-full border-2 border-surface object-cover shadow-lg"
                                title={user.name}
                            />
                            {user.isAvailableForMatch && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full"></span>
                            )}
                        </div>
                    ))}
                    {remainingCount > 0 && (
                        <div className="w-10 h-10 rounded-full border-2 border-surface bg-gray-800 flex items-center justify-center text-[10px] font-bold text-text-secondary shadow-lg">
                            +{remainingCount}
                        </div>
                    )}
                </div>
                
                <div className="flex-grow">
                    <p className="text-xs text-text-secondary leading-tight">
                        Pessoas interessantes estão no <span className="text-text-primary font-bold">{placeName}</span>.
                    </p>
                    <Link to="/match" className="text-[10px] font-black text-accent uppercase tracking-widest mt-1 inline-block hover:underline">
                        Conecte-se no Match →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default WhoIsHere;