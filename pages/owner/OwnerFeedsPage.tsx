import React from 'react';
import { useAppContext } from '../../context/AppContext';
import FeedPostCard from '../../components/FeedPostCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Newspaper, Plus, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OwnerFeedsPage: React.FC = () => {
    const { ownerFeedPosts, isLoading, deleteAllOwnerFeedPosts } = useAppContext();
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDeleteAllPosts = async () => {
        if (!window.confirm("ATENÇÃO: Tem certeza que deseja APAGAR TODOS os seus posts do Feed? Esta ação é irreversível e inclui fotos/vídeos.")) {
            return;
        }
        setIsDeleting(true);
        try {
            await deleteAllOwnerFeedPosts();
            alert("Todos os seus posts do feed foram excluídos com sucesso!");
        } catch (error: any) {
            alert(`Falha ao excluir posts: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner message="Carregando suas postagens..." />;
    }

    return (
        <div className="p-4 relative h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Minhas Postagens</h1>
                <button
                    onClick={() => navigate('/owner/create-post')}
                    className="flex items-center justify-center bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-pink-600 transition-colors"
                >
                    <Plus size={18} className="mr-2" />
                    Novo Post
                </button>
            </div>
            
            {ownerFeedPosts.length > 0 && (
                <div className="mb-6">
                    <button 
                        onClick={handleDeleteAllPosts}
                        disabled={isDeleting}
                        className="w-full text-left p-3 bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors flex items-center justify-center disabled:bg-gray-600"
                    >
                        {isDeleting ? <Loader2 size={20} className="animate-spin mr-2" /> : <Trash2 size={20} className="mr-2" />}
                        {isDeleting ? 'Excluindo Posts...' : 'Apagar Todos os Posts do Feed'}
                    </button>
                </div>
            )}

            {ownerFeedPosts.length === 0 ? (
                <div className="text-center text-text-secondary mt-16">
                    <Newspaper size={48} className="mx-auto text-primary mb-4" />
                    <p className="text-lg font-semibold">Nenhuma postagem encontrada.</p>
                    <p className="text-sm mt-2">Crie sua primeira postagem no feed para engajar com os clientes.</p>
                </div>
            ) : (
                <div className="pb-4">
                    {ownerFeedPosts.map(post => (
                        <FeedPostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OwnerFeedsPage;