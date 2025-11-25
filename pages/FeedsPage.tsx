import React from 'react';
import { Newspaper } from 'lucide-react';

const FeedsPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Newspaper size={48} className="mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold mb-2">Feed de Novidades</h1>
            <p className="text-text-secondary">
                Em breve, aqui você verá as postagens e novidades dos seus locais favoritos.
            </p>
            <p className="text-sm text-text-secondary mt-2">
                (Esta funcionalidade será alimentada por contas de Estabelecimento)
            </p>
        </div>
    );
};

export default FeedsPage;