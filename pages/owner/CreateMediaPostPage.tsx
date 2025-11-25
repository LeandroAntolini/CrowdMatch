import React from 'react';
import CreateMediaPostForm from '../../components/owner/CreateMediaPostForm';

const CreateMediaPostPage: React.FC = () => {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Nova Postagem no Feed</h1>
            <p className="text-text-secondary mb-6">
                Crie uma postagem com imagem ou vídeo para engajar seus clientes. A postagem aparecerá no feed principal do aplicativo.
            </p>
            <CreateMediaPostForm />
        </div>
    );
};

export default CreateMediaPostPage;