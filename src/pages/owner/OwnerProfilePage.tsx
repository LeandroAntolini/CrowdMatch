import React from 'react';
import { Building, Edit } from 'lucide-react';

const OwnerProfilePage: React.FC = () => {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Perfil do Estabelecimento</h1>
            <div className="bg-surface p-6 rounded-lg space-y-4">
                <div className="flex items-center space-x-4">
                    <Building size={40} className="text-primary" />
                    <div>
                        <h2 className="text-2xl font-bold">Nome do Estabelecimento</h2>
                        <p className="text-text-secondary">Categoria (Ex: Bar, Restaurante)</p>
                    </div>
                </div>
                <p className="text-text-secondary">
                    Aqui você poderá gerenciar os locais associados à sua conta, editar informações,
                    fotos e muito mais.
                </p>
                <button className="w-full flex items-center justify-center bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors">
                    <Edit size={18} className="mr-2" />
                    Editar Informações (Em breve)
                </button>
            </div>
        </div>
    );
};

export default OwnerProfilePage;