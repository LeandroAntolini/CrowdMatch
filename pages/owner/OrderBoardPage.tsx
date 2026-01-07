import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { ClipboardList, CheckCircle, Clock, Utensils, Phone, Check, AlertTriangle, User as UserIcon, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

interface TableGroup {
    [tableNumber: number]: {
        [userId: string]: {
            userName: string;
            userPhone: string;
            orders: Order[];
            total: number;
        }
    }
}

const OrderBoardPage: React.FC = () => {
    const { ownedPlaceIds } = useAppContext();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchOrders = async () => {
        if (ownedPlaceIds.length === 0) {
            setLoading(false);
            return;
        }

        try {
            const { data, error: fetchError } = await supabase
                .from('orders')
                .select(`
                    *, 
                    order_items (
                        *, 
                        menu_items (*)
                    ), 
                    profiles (
                        name, 
                        phone
                    )
                `)
                .in('place_id', ownedPlaceIds)
                .neq('status', 'paid')
                .neq('status', 'cancelled')
                .order('created_at', { ascending: true });
            
            if (fetchError) throw fetchError;
            
            setOrders(data || []);
            setError(null);
        } catch (err: any) {
            console.error("Erro ao buscar pedidos:", err);
            setError(err.message || "Falha ao carregar pedidos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        // Configurar áudio de notificação
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

        const channel = supabase.channel('orders-updates')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'orders' 
            }, (payload) => {
                const newOrder = payload.new as any;
                if (ownedPlaceIds.includes(newOrder.place_id)) {
                    toast.success(`Novo pedido na Mesa ${newOrder.table_number}!`, {
                        icon: '🔔',
                        duration: 5000,
                    });
                    audioRef.current?.play().catch(e => console.log("Audio play blocked"));
                    fetchOrders();
                }
            })
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'orders' 
            }, () => fetchOrders())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [ownedPlaceIds]);

    const updateStatus = async (orderId: string, status: OrderStatus) => {
        const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', orderId);
        if (updateError) alert("Erro ao atualizar: " + updateError.message);
        else fetchOrders();
    };

    const groupedOrders = useMemo(() => {
        const groups: TableGroup = {};
        orders.forEach(order => {
            const table = order.table_number;
            const uid = order.user_id;
            
            if (!groups[table]) groups[table] = {};
            if (!groups[table][uid]) {
                groups[table][uid] = {
                    userName: order.profiles?.name || 'Cliente Anon',
                    userPhone: order.profiles?.phone || '',
                    orders: [],
                    total: 0
                };
            }
            
            groups[table][uid].orders.push(order);
            groups[table][uid].total += order.total_price;
        });
        return groups;
    }, [orders]);

    const getStatusColor = (status: OrderStatus) => {
        switch(status) {
            case 'pending': return 'border-yellow-500';
            case 'preparing': return 'border-blue-500';
            case 'delivered': return 'border-green-500';
            default: return 'border-gray-500';
        }
    };

    if (loading) return <LoadingSpinner message="Monitorando pedidos..." />;

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center">
                    <ClipboardList className="mr-2 text-primary" />
                    Painel de Pedidos
                </h1>
                <div className="bg-surface px-3 py-1 rounded-full text-[10px] font-bold text-accent animate-pulse border border-accent/30 flex items-center">
                    <Bell size={12} className="mr-1" /> AO VIVO
                </div>
            </div>

            {Object.keys(groupedOrders).length === 0 ? (
                <div className="text-center py-20 text-text-secondary">
                    <Utensils size={64} className="mx-auto mb-4 opacity-20" />
                    <p>Nenhum pedido pendente nas mesas.</p>
                </div>
            ) : (
                <div className="space-y-8 pb-20">
                    {Object.entries(groupedOrders).map(([tableNum, users]) => (
                        <div key={tableNum} className="space-y-4">
                            <div className="flex items-center bg-gray-800 p-2 rounded-lg border-l-4 border-accent">
                                <h2 className="text-xl font-black text-white px-2">MESA {tableNum}</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4 pl-2 border-l border-gray-700">
                                {Object.entries(users).map(([uid, data]) => (
                                    <div key={uid} className="bg-surface rounded-xl overflow-hidden shadow-md border border-gray-700">
                                        <div className="bg-gray-800/50 p-3 flex justify-between items-center border-b border-gray-700">
                                            <div className="flex items-center">
                                                <UserIcon size={16} className="text-primary mr-2" />
                                                <div>
                                                    <p className="font-bold text-sm text-text-primary">{data.userName}</p>
                                                    {data.userPhone && <p className="text-[10px] text-text-secondary">{data.userPhone}</p>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-text-secondary uppercase font-bold">Consumo</p>
                                                <p className="text-sm font-black text-accent">R$ {data.total.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="p-3 space-y-3">
                                            {data.orders.map(order => (
                                                <div key={order.id} className={`p-2 rounded-lg border-l-4 bg-gray-900/30 ${getStatusColor(order.status)}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                                                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="text-xs font-bold text-text-primary">R$ {order.total_price.toFixed(2)}</span>
                                                    </div>
                                                    
                                                    <div className="space-y-1 mb-3">
                                                        {order.order_items?.map(item => (
                                                            <p key={item.id} className="text-xs text-text-secondary">
                                                                <span className="font-bold text-text-primary">{item.quantity}x</span> {item.menu_item?.name}
                                                            </p>
                                                        ))}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {order.status === 'pending' && (
                                                            <button onClick={() => updateStatus(order.id, 'preparing')} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors flex-1">
                                                                Preparar
                                                            </button>
                                                        )}
                                                        {order.status === 'preparing' && (
                                                            <button onClick={() => updateStatus(order.id, 'delivered')} className="bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors flex-1">
                                                                Entregar
                                                            </button>
                                                        )}
                                                        {order.status === 'delivered' && (
                                                            <button onClick={() => updateStatus(order.id, 'paid')} className="bg-white/10 text-text-primary hover:bg-white hover:text-black px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors flex-1">
                                                                Finalizar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="bg-accent/5 p-2 text-center border-t border-gray-700">
                                            <p className="text-[10px] text-text-secondary">
                                                Total com 10%: <span className="font-bold text-primary">R$ {(data.total * 1.1).toFixed(2)}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderBoardPage;