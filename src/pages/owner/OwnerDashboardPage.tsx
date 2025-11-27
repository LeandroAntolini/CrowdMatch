import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { BarChart2, Ticket, Newspaper, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '../../utils/toast'; // Importar toasts

const OwnerDashboardPage: React.FC = () => {
    const { currentUser, ownerPromotions, ownerFeedPosts, deleteAllLivePosts } = useAppContext();
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = React.useState(false);

    const activePromotionsCount = useMemo(() => {
        if (!ownerPromotions) return 0;
        return ownerPromotions.filter(p => new Date(p.endDate) > new Date()).length;
    }, [ownerPromotions]);

    const feedPostsCount = ownerFeedPosts?.length || 0;
    
    const handleDeleteAllLivePosts = async () => {
        if (!window.confirm("ATENÇÃO: Tem certeza que deseja APAGAR TODOS os posts do Feed Ao Vivo? Esta ação é irreversível.")) {
            return;
        }
        setIsDeleting(true);
        try {
            await deleteAllLivePosts();
            showSuccess("Todos os posts ao vivo foram excluídos com sucesso!");
        } catch (error: any) {
            showError(`Falha ao excluir posts: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Bem-vindo, {currentUser?.name}!</h1>
                <p className="text-text-secondary">Gerencie seu estabelecimento e conecte-se com seus clientes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface p-4 rounded-lg flex items-center space-x-4">
                    <BarChart2 size={32} className="text-primary" />
                    <div>
                        <p className="text-text-secondary text-sm">Visão Geral</p>
                        <p className="text-xl font-bold">Analytics (Em breve)</p>
                    </div>
                </div>
                 <div className="bg-surface p-4 rounded-lg flex items-center space-x-4">
                    <Ticket size={32} className="text-accent" />
                    <div>
                        <p className="text-text-secondary text-sm">Promoções Ativas</p>
                        <p className="text-xl font-bold">{activePromotionsCount}</p>
                    </div>
                </div>
                 <div className="bg-surface p-4 rounded-lg flex items-center space-x-4">
                    <Newspaper size={32} className="text-blue-400" />
                    <div>
                        <p className="text-text-secondary text-sm">Postagens no Feed</p>
                        <p className="text-xl font-bold">{feedPostsCount}</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-surface p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Ações Rápidas</h2>
                <div className="space-y-3">
                    <button 
                        onClick={() => navigate('/owner/promotions/create')}
                        className="w-full text-left p-3 bg-gray-800 hover:bg-accent rounded-md transition-colors"
                    >
                        Criar Nova Promoção
                    </button>
                    <button 
                        onClick={() => navigate('/owner/create-post')}
                        className="w-full text-left p-3 bg-gray-800 hover:bg-accent rounded-md transition-colors"
                    >
                        Fazer uma Postagem no Feed
                    </button>
                    <button 
                        onClick={() => navigate('/owner/verify-qr')}
                        className="w-full text-left p-3 bg-gray-800 hover:bg-accent rounded-md transition-colors"
                    >
                        Verificar QR Code de Cliente
                    </button>
                </div>
            </div>
            
            {/* Novo Bloco de Administração */}
            <div className="bg-surface p-6 rounded-lg border border-red-500/50">
                <h2 className="text-xl font-bold mb-4 text-red-400">Administração</h2>
                <button 
                    onClick={handleDeleteAllLivePosts}
                    disabled={isDeleting}
                    className="w-full text-left p-3 bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors flex items-center justify-center disabled:bg-gray-600"
                >
                    {isDeleting ? <Loader2 size={20} className="animate-spin mr-2" /> : <Trash2 size={20} className="mr-2" />}
                    {isDeleting ? 'Excluir Posts Ao Vivo' : 'Apagar Todos os Posts Ao Vivo'}
                </button>
            </div>
        </div>
    );
};

export default OwnerDashboardPage;