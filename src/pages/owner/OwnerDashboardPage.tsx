import React, { useMemo, useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { 
    Ticket, Trash2, Loader2, Utensils, QrCode, TrendingUp, CheckCircle, Radio, LayoutGrid, Zap, ClipboardList, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VIBE_INFO: { [key: string]: { label: string, icon: string } } = {
    'fire': { label: 'Bombando', icon: '🔥' },
    'music': { label: 'Som Top', icon: '🎵' },
    'drinks': { label: 'Gelada', icon: '🍹' },
    'service': { label: 'Rápido', icon: '⚡' },
    'chill': { label: 'Tranquilo', icon: '😌' },
};

const OwnerDashboardPage: React.FC = () => {
    const { 
        currentUser, ownerPromotions, deleteAllLivePosts, activeOwnedPlaceId, getPlaceById, getVibesForPlace 
    } = useAppContext();
    
    const navigate = useNavigate();
    const [vibes, setVibes] = useState<{ [vibe: string]: number }>({});
    const [loadingVibes, setLoadingVibes] = useState(true);

    const activePlace = activeOwnedPlaceId ? getPlaceById(activeOwnedPlaceId) : null;
    const isNightlife = activePlace?.category === 'Boate' || activePlace?.category === 'Casa de Shows' || activePlace?.category === 'Espaço Musical';
    const labelAmbiente = isNightlife ? 'Comandas' : 'Mesas';

    useEffect(() => {
        if (activeOwnedPlaceId) {
            setLoadingVibes(true);
            getVibesForPlace(activeOwnedPlaceId).then(v => {
                setVibes(v);
                setLoadingVibes(false);
            });
        }
    }, [activeOwnedPlaceId, getVibesForPlace]);

    return (
        <div className="p-6 space-y-8 bg-white min-h-full pb-24">
            <header>
                <h1 className="text-3xl font-black text-text-primary tracking-tighter">Olá, {currentUser?.name.split(' ')[0]}</h1>
                <p className="text-text-secondary text-sm font-medium">
                    {activePlace ? `Gerenciando: ${activePlace.name}` : 'Selecione um local para começar.'}
                </p>
            </header>

            {/* VIBE METER */}
            {activeOwnedPlaceId && (
                <div className="bg-secondary p-6 rounded-3xl border border-border-subtle">
                    <h2 className="text-[10px] font-black uppercase text-text-secondary mb-4 tracking-widest flex items-center">
                        <Zap size={14} className="mr-2 text-accent" /> Clima do Público (2h)
                    </h2>
                    
                    {loadingVibes ? (
                        <div className="flex space-x-2 animate-pulse">
                            <div className="h-10 w-24 bg-white rounded-xl"></div>
                            <div className="h-10 w-24 bg-white rounded-xl"></div>
                        </div>
                    ) : Object.keys(vibes).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(vibes).map(([type, count]) => (
                                <div key={type} className="bg-white px-4 py-2 rounded-xl border border-border-subtle flex items-center shadow-sm">
                                    <span className="text-lg mr-2">{VIBE_INFO[type]?.icon}</span>
                                    <span className="text-xs font-black text-text-primary uppercase">{count} {VIBE_INFO[type]?.label}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-text-secondary italic">Aguardando os primeiros votos dos clientes...</p>
                    )}
                </div>
            )}

            {/* ATALHOS PRINCIPAIS */}
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => navigate('/owner/tables')} className="bg-white p-6 rounded-3xl border border-border-subtle flex flex-col items-center text-center hover:bg-secondary transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
                        <LayoutGrid size={24} />
                    </div>
                    <span className="text-xs font-black text-text-primary uppercase tracking-widest">{labelAmbiente}</span>
                </button>
                <button onClick={() => navigate('/owner/orders')} className="bg-white p-6 rounded-3xl border border-border-subtle flex flex-col items-center text-center hover:bg-secondary transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-3 group-hover:scale-110 transition-transform">
                        <ClipboardList size={24} />
                    </div>
                    <span className="text-xs font-black text-text-primary uppercase tracking-widest">Pedidos</span>
                </button>
                <button onClick={() => navigate('/owner/menu')} className="bg-white p-6 rounded-3xl border border-border-subtle flex flex-col items-center text-center hover:bg-secondary transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-text-primary/5 flex items-center justify-center text-text-primary mb-3 group-hover:scale-110 transition-transform">
                        <Utensils size={24} />
                    </div>
                    <span className="text-xs font-black text-text-primary uppercase tracking-widest">Cardápio</span>
                </button>
                <button onClick={() => navigate('/owner/promotions')} className="bg-white p-6 rounded-3xl border border-border-subtle flex flex-col items-center text-center hover:bg-secondary transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center text-yellow-600 mb-3 group-hover:scale-110 transition-transform">
                        <Ticket size={24} />
                    </div>
                    <span className="text-xs font-black text-text-primary uppercase tracking-widest">Promos</span>
                </button>
            </div>

            {/* FERRAMENTAS */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-2">Configurações Rápidas</h3>
                <div className="bg-secondary rounded-3xl border border-border-subtle overflow-hidden">
                    <button onClick={() => navigate('/owner/qrs')} className="w-full p-4 flex items-center justify-between hover:bg-white border-b border-border-subtle transition-colors">
                        <div className="flex items-center"><QrCode size={20} className="mr-3 text-text-secondary" /><span className="text-sm font-bold">Imprimir QR das {labelAmbiente}</span></div>
                        <Settings size={16} className="text-text-secondary" />
                    </button>
                    <button onClick={() => navigate('/owner/verify-qr')} className="w-full p-4 flex items-center justify-between hover:bg-white transition-colors">
                        <div className="flex items-center"><CheckCircle size={20} className="mr-3 text-text-secondary" /><span className="text-sm font-bold">Validar Ticket de Cliente</span></div>
                        <Settings size={16} className="text-text-secondary" />
                    </button>
                </div>
            </div>

            <div className="pt-4">
                <button 
                    onClick={async () => { if(window.confirm("Limpar mural de comentários?")) await deleteAllLivePosts(); }}
                    className="w-full py-4 text-red-500 font-black text-xs uppercase tracking-widest border-2 border-red-500/20 rounded-2xl hover:bg-red-50 transition-colors"
                >
                    Limpar Mural de Comentários
                </button>
            </div>
        </div>
    );
};

export default OwnerDashboardPage;