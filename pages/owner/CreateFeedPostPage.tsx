import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Radio } from 'lucide-react';

const CreateFeedPostPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-2">Criar Postagem</h1>
            <p className="text-text-secondary mb-8">Escolha o tipo de conteúdo que você quer publicar no feed.</p>

            <div className="space-y-4">
                <button
                    onClick={() => navigate('/owner/create-media-post')}
                    className="w-full flex items-center p-6 bg-surface rounded-lg text-left hover:bg-gray-700 transition-colors"
                >
                    <Image size={32} className="text-primary mr-4" />
                    <div>
                        <h2 className="font-bold text-lg text-text-primary">Foto ou Vídeo</h2>
                        <p className="text-sm text-text-secondary">Publique uma imagem ou vídeo do seu estabelecimento.</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/owner/create-live-repost')}
                    className="w-full flex items-center p-6 bg-surface rounded-lg text-left hover:bg-gray-700 transition-colors"
                >
                    <Radio size={32} className="text-accent mr-4" />
                    <div>
                        <h2 className="font-bold text-lg text-text-primary">Destaque Ao Vivo</h2>
                        <p className="text-sm text-text-secondary">Crie um card com os últimos comentários ao vivo do seu local.</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default CreateFeedPostPage;