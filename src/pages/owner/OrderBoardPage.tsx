import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderStatus } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ClipboardList, CheckCircle2, Clock, Utensils, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const OrderBoardPage: React.FC = () => {
    const { activeOwnedPlaceId } = useAppContext();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        if (!activeOwnedPlaceId) return;
        
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, menu_items(*)), profiles:user_id(name)')
            .eq('place_id', activeOwnedPlaceId)
            .not('status', 'in', '("paid", "cancelled")')
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Erro ao carregar pedidos:", error);
        } else {
            setOrders(data as unknown as Order[]);
        }
        setLoading(false);
    }, [activeOwnedPlaceId]);

    useEffect(() => {
        fetchOrders();

        if (!activeOwnedPlaceId) return;

        const channel = supabase
            .channel('orders-realtime')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'orders',
                filter: `place_id=eq.${activeOwnedPlaceId}` 
            }, () => {
                fetchOrders();
                toast('Novo status de pedido!', { icon: '🔔' });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeOwnedPlaceId, fetchOrders]);

    const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) toast.error("Erro ao atualizar.");
        else toast.success("Status atualizado!");
    };

    const getStatusStyle = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'border-yellow-400 bg-yellow-50 text-yellow-700';
            case 'preparing': return 'border-primary/40 bg-primary/5 text-primary';
            case 'delivering': return 'border-accent/40 bg-accent/5 text-accent';
            case 'delivered': return 'border-green-400 bg-green-50 text-green-700';
            default: return 'border-border-subtle bg-secondary text-text-secondary';
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

    if (!activeOwnedPlaceId) return <div className="p-10 text-center opacity-50">Nenhum local selecionado.</div>;

    return (
        <div className="p-6 space-y-8 pb-24 bg-white min-h-full">
            <header>
                <h1 className="text-2xl font-black text-text-primary uppercase tracking-tighter flex items-center">
                    <ClipboardList className="mr-3 text-primary" />
                    Painel de Cozinha
                </h1>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-1">Gerencie os pedidos em tempo real</p>
            </header>

            {loading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {orders.length === 0 ? (
                        <div className="col-span-full py-32 text-center opacity-20 flex flex-col items-center">
                            <Utensils size={64} className="mb-4" />
                            <p className="font-black uppercase tracking-widest">Nenhum pedido ativo</p>
                        </div>
                    ) : orders.map(order => {
                        const next = getNextStatus(order.status);
                        return (
                            <div key={order.id} className={`rounded-3xl border p-5 flex flex-col h-full shadow-sm transition-all animate-fade-in-up ${getStatusStyle(order.status)}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-[10px] font-black uppercase tracking-widest opacity-60">Mesa {order.table_number}</h2>
                                        <p className="font-black text-lg text-text-primary truncate">{order.profiles?.name || 'Cliente'}</p>
                                    </div>
                                    <div className="bg-white/50 px-2 py-1 rounded-lg">
                                        <span className="text-[10px] font-black">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>

                                <div className="flex-grow space-y-2 mb-6">
                                    {order.order_items?.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                            <p className="font-bold text-text-primary">
                                                <span className="text-accent font-black mr-2">{item.quantity}x</span>
                                                {item.menu_item?.name}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {next ? (
                                    <button 
                                        onClick={() => updateStatus(order.id, next.status)}
                                        className="w-full bg-text-primary text-white font-black py-4 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all uppercase tracking-widest text-[10px]"
                                    >
                                        <ChevronRight size={16} className="mr-1.5" />
                                        {next.label}
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-center py-4 text-[10px] font-black uppercase tracking-widest opacity-40">
                                        <CheckCircle2 size={16} className="mr-2" />
                                        Entregue
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