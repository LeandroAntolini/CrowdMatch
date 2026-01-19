import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderStatus } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ClipboardList, CheckCircle2, Clock, Utensils, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const OrderBoardPage: React.FC = () => {
    const { ownedPlaceIds, getPlaceById } = useAppContext();
    const [selectedPlaceId, setSelectedPlaceId] = useState(ownedPlaceIds[0] || '');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        if (!selectedPlaceId) return;
        
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, menu_items(*)), profiles:user_id(name)')
            .eq('place_id', selectedPlaceId)
            .not('status', 'in', '("paid", "cancelled")')
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Erro ao carregar pedidos:", error);
        } else {
            setOrders(data as unknown as Order[]);
        }
        setLoading(false);
    }, [selectedPlaceId]);

    useEffect(() => {
        fetchOrders();

        // Escuta mudanças em tempo real na tabela de pedidos
        const channel = supabase
            .channel('orders-realtime')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'orders',
                filter: `place_id=eq.${selectedPlaceId}` 
            }, () => {
                fetchOrders();
                // Notifica o lojista sobre novos pedidos
                toast('Atualização nos pedidos!', { icon: '🔔' });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedPlaceId, fetchOrders]);

    const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) {
            toast.error("Erro ao atualizar status.");
        } else {
            toast.success("Status atualizado!");
        }
    };

    const getStatusStyle = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'border-yellow-500 bg-yellow-500/10 text-yellow-500';
            case 'preparing': return 'border-blue-500 bg-blue-500/10 text-blue-500';
            case 'delivering': return 'border-orange-500 bg-orange-500/10 text-orange-500';
            case 'delivered': return 'border-green-500 bg-green-500/10 text-green-500';
            default: return 'border-gray-500 bg-gray-500/10 text-gray-500';
        }
    };

    const getNextStatus = (status: OrderStatus): { status: OrderStatus; label: string } | null => {
        switch (status) {
            case 'pending': return { status: 'preparing', label: 'Começar Preparo' };
            case 'preparing': return { status: 'delivering', label: 'Pronto para Entrega' };
            case 'delivering': return { status: 'delivered', label: 'Entregue na Mesa' };
            default: return null;
        }
    };

    if (ownedPlaceIds.length === 0) return <div className="p-10 text-center opacity-50">Nenhum local associado.</div>;

    return (
        <div className="p-6 space-y-6 pb-24">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black flex items-center">
                    <ClipboardList className="mr-2 text-accent" />
                    PAINEL DE PEDIDOS
                </h1>
                <select 
                    value={selectedPlaceId}
                    onChange={(e) => setSelectedPlaceId(e.target.value)}
                    className="p-2 bg-surface border border-gray-700 rounded-lg text-sm font-bold"
                >
                    {ownedPlaceIds.map(id => (
                        <option key={id} value={id}>{getPlaceById(id)?.name || id}</option>
                    ))}
                </select>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.length === 0 ? (
                        <div className="col-span-full py-20 text-center opacity-30 flex flex-col items-center">
                            <Utensils size={64} className="mb-4" />
                            <p className="text-xl font-bold uppercase tracking-widest">Nenhum pedido ativo agora</p>
                        </div>
                    ) : orders.map(order => {
                        const next = getNextStatus(order.status);
                        return (
                            <div key={order.id} className={`bg-surface rounded-2xl border-2 ${getStatusStyle(order.status)} p-5 flex flex-col h-full shadow-xl animate-fade-in-up`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xs font-black uppercase tracking-widest opacity-70">Mesa {order.table_number}</h2>
                                        <p className="font-bold text-text-primary">{order.profiles?.name || 'Cliente'}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>

                                <div className="flex-grow space-y-3 mb-6">
                                    {order.order_items?.map(item => (
                                        <div key={item.id} className="flex justify-between items-center border-b border-gray-800 pb-2 last:border-0">
                                            <span className="font-bold text-sm">
                                                <span className="text-accent mr-2">{item.quantity}x</span>
                                                {item.menu_item?.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {next ? (
                                    <button 
                                        onClick={() => updateStatus(order.id, next.status)}
                                        className="w-full bg-white text-background font-black py-3 rounded-xl flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs"
                                    >
                                        <ChevronRight size={18} className="mr-1" />
                                        {next.label}
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-center py-3 text-[10px] font-black uppercase tracking-widest opacity-50">
                                        <CheckCircle2 size={16} className="mr-2" />
                                        Pedido Finalizado
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OrderBoardPage;