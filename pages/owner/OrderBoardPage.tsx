import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { ClipboardList, Clock, Utensils, User as UserIcon, Bell, ChevronDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const OrderBoardPage: React.FC = () => {
    const { ownedPlaceIds, getPlaceById } = useAppContext();
    const [selectedPlaceId, setSelectedPlaceId] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (ownedPlaceIds.length > 0 && !selectedPlaceId) setSelectedPlaceId(ownedPlaceIds[0]);
    }, [ownedPlaceIds, selectedPlaceId]);

    const fetchOrders = useCallback(async () => {
        if (!selectedPlaceId) return;
        
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, menu_items(*)), profiles(name, phone)')
            .eq('place_id', selectedPlaceId)
            .neq('status', 'paid')
            .neq('status', 'cancelled')
            .order('created_at', { ascending: true });
        
        if (!error) {
            setOrders(data || []);
        } else {
            console.error("Erro ao buscar pedidos:", error);
        }
        setLoading(false);
    }, [selectedPlaceId]);

    useEffect(() => {
        if (!selectedPlaceId) return;
        fetchOrders();

        // Inscrição Real-time para novos pedidos e mudanças de itens
        const channel = supabase.channel(`orders-wall-${selectedPlaceId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'orders', 
                filter: `place_id=eq.${selectedPlaceId}` 
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    toast.success("Novo pedido na mesa " + payload.new.table_number, { duration: 5000, icon: '🔥' });
                    // Tenta tocar um som de alerta
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.play().catch(() => {});
                }
                fetchOrders();
            })
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'order_items' 
            }, () => fetchOrders())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedPlaceId, fetchOrders]);

    const updateStatus = async (id: string, status: OrderStatus) => {
        const { error } = await supabase.from('orders').update({ status }).eq('id', id);
        if (error) toast.error("Erro ao atualizar status.");
    };

    const groupedByTable = useMemo(() => {
        const tables: { [key: number]: { [key: string]: { name: string, phone: string, orders: Order[], total: number } } } = {};
        
        orders.forEach(order => {
            const tNum = order.table_number;
            const uId = order.user_id;

            if (!tables[tNum]) tables[tNum] = {};
            if (!tables[tNum][uId]) {
                tables[tNum][uId] = {
                    name: order.profiles?.name || 'Cliente',
                    phone: order.profiles?.phone || '',
                    orders: [],
                    total: 0
                };
            }
            tables[tNum][uId].orders.push(order);
            tables[tNum][uId].total += order.total_price;
        });
        return tables;
    }, [orders]);

    if (loading) return <LoadingSpinner message="Carregando pedidos ativos..." />;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-24">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-black flex items-center uppercase tracking-tight">
                        <ClipboardList className="mr-2 text-primary" /> 
                        Gestão de Pedidos
                    </h1>
                    <button onClick={fetchOrders} className="p-2 bg-gray-800 rounded-full text-text-secondary hover:text-white transition-colors">
                        <RefreshCw size={20} />
                    </button>
                </div>
                
                <div className="relative w-full md:w-72">
                    <select 
                        value={selectedPlaceId} 
                        onChange={e => setSelectedPlaceId(e.target.value)} 
                        className="w-full p-4 bg-surface border border-gray-700 rounded-2xl appearance-none outline-none font-bold text-sm shadow-xl"
                    >
                        {ownedPlaceIds.map(id => (
                            <option key={id} value={id}>{getPlaceById(id)?.name || "Seu Estabelecimento"}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary" size={20} />
                </div>
            </header>

            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-text-secondary opacity-50">
                    <Utensils size={64} className="mb-4" />
                    <p className="text-lg font-bold">Nenhum pedido pendente.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(groupedByTable).sort(([a], [b]) => Number(a) - Number(b)).map(([table, users]) => (
                        <div key={table} className="space-y-4">
                            <div className="bg-primary text-background px-4 py-2 rounded-xl inline-block font-black shadow-lg">
                                MESA {table}
                            </div>
                            
                            {Object.entries(users).map(([uid, data]) => (
                                <div key={uid} className="bg-surface rounded-2xl overflow-hidden border border-gray-700 shadow-2xl hover:border-accent/30 transition-colors">
                                    <div className="bg-gray-800/50 p-4 flex justify-between items-center border-b border-gray-700">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mr-3 border border-accent/30">
                                                <UserIcon size={20} className="text-accent" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-sm truncate max-w-[120px]">{data.name}</h3>
                                                <p className="text-[10px] text-text-secondary">{data.phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-bold text-gray-500">Subtotal</p>
                                            <p className="font-black text-primary">R$ {data.total.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-4">
                                        {data.orders.map((o: Order) => (
                                            <div key={o.id} className={`p-4 rounded-xl border-l-4 shadow-inner ${o.status === 'pending' ? 'bg-yellow-500/5 border-yellow-500' : 'bg-blue-500/5 border-blue-500'}`}>
                                                <div className="flex justify-between text-[10px] uppercase font-black mb-3">
                                                    <span className="flex items-center text-text-secondary">
                                                        <Clock size={12} className="mr-1" />
                                                        {new Date(o.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                    </span>
                                                    <span className="text-accent">R$ {o.total_price.toFixed(2)}</span>
                                                </div>

                                                <div className="space-y-2 mb-4">
                                                    {o.order_items?.map(i => (
                                                        <div key={i.id} className="flex justify-between text-xs font-bold">
                                                            <span className="text-text-primary">{i.quantity}x {i.menu_item?.name}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex gap-2">
                                                    {o.status === 'pending' && (
                                                        <button onClick={() => updateStatus(o.id, 'preparing')} className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl flex-1 text-[10px] font-black uppercase transition-all shadow-md">
                                                            Preparar
                                                        </button>
                                                    )}
                                                    {o.status === 'preparing' && (
                                                        <button onClick={() => updateStatus(o.id, 'delivered')} className="bg-green-600 hover:bg-green-500 text-white p-3 rounded-xl flex-1 text-[10px] font-black uppercase transition-all shadow-md">
                                                            Entregar
                                                        </button>
                                                    )}
                                                    {o.status === 'delivered' && (
                                                        <button onClick={() => updateStatus(o.id, 'paid')} className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-xl flex-1 text-[10px] font-black uppercase transition-all">
                                                            Pago / Finalizar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderBoardPage;