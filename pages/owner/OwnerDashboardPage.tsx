import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { BarChart2, Ticket, Newspaper, Trash2, Loader2, Utensils, QrCode, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
            alert("Todos os posts ao vivo foram excluídos com sucesso!");
        } catch (error: any) {
            alert(`Falha ao excluir posts: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-6 space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold">Painel do Lojista</h1>
                <p className="text-text-secondary">Olá, {currentUser?.name}. Veja como está seu movimento.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div onClick={() => navigate('/owner/orders')} className="bg-surface p-4 rounded-xl flex flex-col items-center justify-center border border-accent/20 cursor-pointer hover:bg-gray-800">
                    <ClipboardList size={32} className="text-accent mb-2" />
                    <p className="text-xs text-text-secondary">Ver Pedidos</p>
                </div>
                <div onClick={() => navigate('/owner/menu')} className="bg-surface p-4 rounded-xl flex flex-col items-center justify-center border border-primary/20 cursor-pointer hover:bg-gray-800">
                    <Utensils size={32} className="text-primary mb-2" />
                    <p className="text-xs text-text-secondary">Cardápio</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface p-4 rounded-lg flex items-center space-x-4">
                    <BarChart2 size={32} className="text-primary" />
                    <div>
                        <p className="text-text-secondary text-sm">Visão Geral</p>
                        <p className="text-xl font-bold">Analytics</p>
                    </div>
                </div>
                 <div className="bg-surface p-4 rounded-lg flex items-center space-x-4">
                    <Ticket size={32} className="text-accent" />
                    <div>
                        <p className="text-text-secondary text-sm">Promos Ativas</p>
                        <p className="text-xl font-bold">{activePromotionsCount}</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-surface p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Operacional</h2>
                <div className="space-y-3">
                    <button 
                        onClick={() => navigate('/owner/qrs')}
                        className="w-full text-left p-4 bg-gray-800 hover:bg-accent rounded-xl transition-colors flex items-center"
                    >
                        <QrCode className="mr-3" size={20} />
                        Gerar QR Codes das Mesas
                    </button>
                    <button 
                        onClick={() => navigate('/owner/promotions/create')}
                        className="w-full text-left p-4 bg-gray-800 hover:bg-accent rounded-xl transition-colors flex items-center"
                    >
                        <Ticket className="mr-3" size={20} />
                        Criar Nova Promoção
                    </button>
                    <button 
                        onClick={() => navigate('/owner/verify-qr')}
                        className="w-full text-left p-4 bg-gray-800 hover:bg-accent rounded-xl transition-colors flex items-center"
                    >
                        <QrCode className="mr-3" size={20} />
                        Validar Ticket de Cliente
                    </button>
                </div>
            </div>
            
            <div className="bg-surface p-6 rounded-lg border border-red-500/50">
                <h2 className="text-xl font-bold mb-4 text-red-400">Segurança</h2>
                <button 
                    onClick={handleDeleteAllLivePosts}
                    disabled={isDeleting}
                    className="w-full text-left p-3 bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors flex items-center justify-center disabled:bg-gray-600"
                >
                    {isDeleting ? <Loader2 size={20} className="animate-spin mr-2" /> : <Trash2 size={20} className="mr-2" />}
                    Apagar Feed Ao Vivo
                </button>
            </div>
        </div>
    );
};

export default OwnerDashboardPage;