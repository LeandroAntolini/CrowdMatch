import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { BarChart2, Ticket, Newspaper, Trash2, Loader2, Utensils, QrCode, ClipboardList, TrendingUp, CheckCircle, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OwnerDashboardPage: React.FC = () => {
    const { currentUser, ownerPromotions, ownerFeedPosts, deleteAllLivePosts } = useAppContext();
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = React.useState(false);

    const activePromotionsCount = useMemo(() => {
        if (!ownerPromotions) return 0;
        return ownerPromotions.filter(p => new Date(p.endDate) > new Date()).length;
    }, [ownerPromotions]);

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
        <div className="p-4 md:p-8 space-y-8 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-text-primary">Painel do Lojista</h1>
                    <p className="text-text-secondary mt-1">Olá, {currentUser?.name}. Veja o resumo da sua operação hoje.</p>
                </div>
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl flex items-center border border-primary/20">
                    <TrendingUp size={20} className="mr-2" />
                    <span className="font-bold text-sm">Operação Ativa</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div onClick={() => navigate('/owner/orders')} className="bg-surface p-6 rounded-2xl flex flex-col items-center justify-center border border-accent/20 cursor-pointer hover:bg-gray-800 transition-all hover:scale-[1.02] shadow-lg">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                        <ClipboardList size={32} className="text-accent" />
                    </div>
                    <p className="font-black text-lg">Pedidos</p>
                    <p className="text-xs text-text-secondary">Gestão de Mesas</p>
                </div>
                
                <div onClick={() => navigate('/owner/menu')} className="bg-surface p-6 rounded-2xl flex flex-col items-center justify-center border border-primary/20 cursor-pointer hover:bg-gray-800 transition-all hover:scale-[1.02] shadow-lg">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Utensils size={32} className="text-primary" />
                    </div>
                    <p className="font-black text-lg">Cardápio</p>
                    <p className="text-xs text-text-secondary">Produtos e Preços</p>
                </div>

                <div className="bg-surface p-6 rounded-2xl flex flex-col items-center justify-center border border-gray-700 shadow-lg">
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4 text-accent">
                        <Ticket size={32} />
                    </div>
                    <p className="font-black text-lg">{activePromotionsCount}</p>
                    <p className="text-xs text-text-secondary">Promoções Ativas</p>
                </div>

                <div className="bg-surface p-6 rounded-2xl flex flex-col items-center justify-center border border-gray-700 shadow-lg">
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4 text-primary">
                        <BarChart2 size={32} />
                    </div>
                    <p className="font-black text-lg">Status</p>
                    <p className="text-xs text-text-secondary">Desempenho Online</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface p-8 rounded-2xl border border-gray-800 shadow-xl">
                    <h2 className="text-xl font-black mb-6 flex items-center uppercase tracking-wider">
                        <QrCode className="mr-3 text-accent" />
                        Ferramentas Operacionais
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={() => navigate('/owner/qrs')}
                            className="text-left p-5 bg-gray-800/50 hover:bg-accent hover:text-white rounded-2xl transition-all flex flex-col border border-gray-700"
                        >
                            <QrCode size={24} className="mb-2" />
                            <span className="font-bold">QR das Mesas</span>
                            <span className="text-[10px] opacity-70">Gerar PDF para impressão</span>
                        </button>
                        <button 
                            onClick={() => navigate('/owner/promotions/create')}
                            className="text-left p-5 bg-gray-800/50 hover:bg-accent hover:text-white rounded-2xl transition-all flex flex-col border border-gray-700"
                        >
                            <Ticket size={24} className="mb-2" />
                            <span className="font-bold">Nova Promo</span>
                            <span className="text-[10px] opacity-70">Atrair mais clientes</span>
                        </button>
                        <button 
                            onClick={() => navigate('/owner/verify-qr')}
                            className="text-left p-5 bg-gray-800/50 hover:bg-accent hover:text-white rounded-2xl transition-all flex flex-col border border-gray-700"
                        >
                            <CheckCircle size={24} className="mb-2" />
                            <span className="font-bold">Validar Ticket</span>
                            <span className="text-[10px] opacity-70">Confirmar resgates</span>
                        </button>
                        <button 
                            onClick={() => navigate('/owner/live')}
                            className="text-left p-5 bg-gray-800/50 hover:bg-accent hover:text-white rounded-2xl transition-all flex flex-col border border-gray-700"
                        >
                            <Radio size={24} className="mb-2" />
                            <span className="font-bold">Feed Ao Vivo</span>
                            <span className="text-[10px] opacity-70">Ver comentários locais</span>
                        </button>
                    </div>
                </div>

                <div className="bg-surface p-8 rounded-2xl border border-red-500/20 shadow-xl flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-black mb-6 flex items-center uppercase tracking-wider text-red-400">
                            <Trash2 className="mr-3" />
                            Segurança do Feed
                        </h2>
                        <p className="text-sm text-text-secondary mb-6">
                            Em caso de necessidade moderatória urgente, você pode limpar instantaneamente todas as postagens ao vivo do seu estabelecimento para manter a boa vibe do local.
                        </p>
                    </div>
                    <button 
                        onClick={handleDeleteAllLivePosts}
                        disabled={isDeleting}
                        className="w-full text-center p-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 rounded-2xl transition-all font-black uppercase tracking-widest disabled:bg-gray-800 disabled:text-gray-600"
                    >
                        {isDeleting ? <Loader2 size={24} className="animate-spin mx-auto" /> : 'Apagar Todos os Posts Ao Vivo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboardPage;