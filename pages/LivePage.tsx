import React from 'react';
import { Radio } from 'lucide-react';

const LivePage: React.FC = () => {
    return (
        <div className="p-4">
            <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary mt-16">
                <Radio size={64} className="text-primary mb-4" />
                <h2 className="text-2xl font-semibold text-text-primary">Em Breve!</h2>
                <p className="mt-2">Aqui você encontrará transmissões ao vivo e eventos exclusivos acontecendo agora.</p>
                <p className="mt-1 text-sm">Fique ligado para não perder nada!</p>
            </div>
        </div>
    );
};

export default LivePage;