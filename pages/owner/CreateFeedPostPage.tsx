import React from 'react';
import CreateFeedPostForm from '../../components/owner/CreateFeedPostForm';

const CreateFeedPostPage: React.FC = () => {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Nova Postagem no Feed</h1>
            <p className="text-text-secondary mb-6">
                Crie uma postagem com imagem ou vídeo para engajar seus clientes. A postagem aparecerá no feed principal do aplicativo.
            </p>
            <CreateFeedPostForm />
        </div>
    );
};

export default CreateFeedPostPage;