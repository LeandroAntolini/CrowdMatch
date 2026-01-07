import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { ClipboardList, CheckCircle, Clock, Utensils, Phone, Check, AlertTriangle, User as UserIcon, Bell, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

interface UserOrderData {
    userName: string;
    userPhone: string;
    orders: Order[];
    total: number;
}

interface TableGroup {
    [tableNumber: number]: {
        [userId: string]: UserOrderData
    }
}

const OrderBoardPage: React.FC = () => {
    const { ownedPlaceIds, getPlaceById } = useAppContext();
    const [selectedPlaceId, setSelectedPlaceId] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (ownedPlaceIds.length > 0 && !selectedPlaceId) {
            setSelectedPlaceId(ownedPlaceIds[0]);
        }
    }, [ownedPlaceIds, selectedPlaceId]);

    const fetchOrders = async () => {
        if (!selectedPlaceId) {
            setLoading(false);
            return;
        }

        try {
            // Busca simplificada sem joins complexos primeiro para garantir visibilidade RLS
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
                .eq('place_id', selectedPlaceId)
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
        if (!selectedPlaceId) return;

        fetchOrders();
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

        // Canal de escuta em tempo real mais abrangente
        const channel = supabase.channel(`orders-updates-${selectedPlaceId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'orders',
                filter: `place_id=eq.${selectedPlaceId}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newOrder = payload.new as any;
                    toast.success(`Novo pedido na Mesa ${newOrder.table_number}!`, {
                        icon: '🔔',
                        duration: 5000,
                    });
                    audioRef.current?.play().catch(() => {});
                }
                // Recarrega em qualquer mudança (insert, update, delete)
                fetchOrders();
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'order_items'
            }, () => fetchOrders()) // Recarrega se os itens mudarem
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedPlaceId]);

    const updateStatus = async (orderId: string, status: OrderStatus) => {
        const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', orderId);
        if (updateError) toast.error("Erro ao atualizar: " + updateError.message);
        // O tempo real cuidará do refresh
    };

    const groupedOrders = useMemo(() => {
        const groups: TableGroup = {};
        orders.forEach(order => {
            const table = order.table_number;
            const uid = order.user_id;
            
            if (!groups[table]) groups[table] = {};
            if (!groups[table][uid]) {
                groups[table][uid] = {
                    userName: order.profiles?.name || 'Cliente',
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
            case 'pending': return 'border-yellow-500 bg-yellow-500/10';
            case 'preparing': return 'border-blue-500 bg-blue-500/10';
            case 'delivered': return 'border-green-500 bg-green-500/10';
            default: return 'border-gray-500';
        }
    };

    if (ownedPlaceIds.length === 0) {
        return <div className="p-6 text-center">Você não gerencia nenhum estabelecimento.</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center">
                        <ClipboardList className="mr-2 text-primary" />
                        Pedidos
                    </h1>
                    <div className="bg-surface px-3 py-1 rounded-full text-[10px] font-bold text-accent animate-pulse border border-accent/30 flex items-center">
                        <Bell size={12} className="mr-1" /> AO VIVO
                    </div>
                </div>

                <div className="relative w-full md:w-64">
                    <select 
                        value={selectedPlaceId}
                        onChange={(e) => setSelectedPlaceId(e.target.value)}
                        className="w-full p-3 bg-surface border border-gray-700 rounded-xl appearance-none focus:ring-2 focus:ring-accent outline-none font-bold text-text-primary text-sm"
                    >
                        {ownedPlaceIds.map(id => (
                            <option key={id} value={id}>{getPlaceById(id)?.name || "Local"}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={18} />
                </div>
            </div>

            {loading ? <LoadingSpinner message="Monitorando pedidos..." /> : (
                <>
                    {Object.keys(groupedOrders).length === 0 ? (
                        <div className="text-center py-20 text-text-secondary">
                            <Utensils size={64} className="mx-auto mb-4 opacity-20" />
                            <p>Nenhum pedido pendente em {getPlaceById(selectedPlaceId)?.name}.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                            {Object.entries(groupedOrders).map(([tableNum, users]) => (
                                <div key={tableNum} className="space-y-4">
                                    <div className="flex items-center bg-gray-800 p-3 rounded-xl border-l-4 border-accent shadow-sm">
                                        <h2 className="text-xl font-black text-white">MESA {tableNum}</h2>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {Object.entries(users).map(([uid, data]) => {
                                            const userData = data as UserOrderData;
                                            return (
                                                <div key={uid} className="bg-surface rounded-xl overflow-hidden shadow-lg border border-gray-700 hover:border-accent/30 transition-colors">
                                                    <div className="bg-gray-800/50 p-3 flex justify-between items-center border-b border-gray-700">
                                                        <div className="flex items-center">
                                                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mr-2">
                                                                <UserIcon size={16} className="text-accent" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-text-primary truncate max-w-[120px]">{userData.userName}</p>
                                                                {userData.userPhone && <p className="text-[10px] text-text-secondary">{userData.userPhone}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-text-secondary uppercase font-bold">Total</p>
                                                            <p className="text-sm font-black text-primary">R$ {userData.total.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="p-3 space-y-3">
                                                        {userData.orders.map(order => (
                                                            <div key={order.id} className={`p-3 rounded-lg border-l-4 ${getStatusColor(order.status)}`}>
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center">
                                                                        <Clock size={10} className="mr-1" />
                                                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                    <span className="text-xs font-bold text-text-primary">R$ {order.total_price.toFixed(2)}</span>
                                                                </div>
                                                                
                                                                <div className="space-y-1.5 mb-4">
                                                                    {order.order_items?.map(item => (
                                                                        <div key={item.id} className="flex justify-between text-xs">
                                                                            <span className="text-text-secondary"><span className="font-bold text-text-primary">{item.quantity}x</span> {item.menu_item?.name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                <div className="flex gap-2">
                                                                    {order.status === 'pending' && (
                                                                        <button onClick={() => updateStatus(order.id, 'preparing')} className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-colors flex-1 shadow-sm">
                                                                            Preparar
                                                                        </button>
                                                                    )}
                                                                    {order.status === 'preparing' && (
                                                                        <button onClick={() => updateStatus(order.id, 'delivered')} className="bg-green-600 text-white hover:bg-green-700 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-colors flex-1 shadow-sm">
                                                                            Entregar
                                                                        </button>
                                                                    )}
                                                                    {order.status === 'delivered' && (
                                                                        <button onClick={() => updateStatus(order.id, 'paid')} className="bg-surface text-text-primary border border-gray-600 hover:bg-gray-700 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-colors flex-1">
                                                                            Finalizar
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default OrderBoardPage;