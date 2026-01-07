import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order } from '../../types';
import { ClipboardList, ChevronRight, User as UserIcon, RefreshCw, ChevronDown, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import OwnerOrderDetailsModal from '../../components/owner/OwnerOrderDetailsModal';
import { toast } from 'react-hot-toast';

const OrderBoardPage: React.FC = () => {
    const { ownedPlaceIds, getPlaceById } = useAppContext();
    const [selectedPlaceId, setSelectedPlaceId] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedComanda, setSelectedComanda] = useState<{ table: number, name: string, uid: string } | null>(null);

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
        }
        setLoading(false);
    }, [selectedPlaceId]);

    useEffect(() => {
        if (!selectedPlaceId) return;
        fetchOrders();

        const channel = supabase.channel(`orders-list-${selectedPlaceId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'orders', 
                filter: `place_id=eq.${selectedPlaceId}` 
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    toast.success(`Novo pedido: Mesa ${payload.new.table_number}`, { icon: '🔔' });
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

    const groupedOrders = useMemo(() => {
        const groups: { [key: string]: { table: number, name: string, userId: string, orders: Order[], total: number, lastUpdate: string } } = {};
        
        orders.forEach(order => {
            const key = `${order.table_number}-${order.user_id}`;
            if (!groups[key]) {
                groups[key] = {
                    table: order.table_number,
                    name: order.profiles?.name || 'Cliente',
                    userId: order.user_id,
                    orders: [],
                    total: 0,
                    lastUpdate: order.created_at
                };
            }
            groups[key].orders.push(order);
            groups[key].total += order.total_price;
            if (new Date(order.created_at) > new Date(groups[key].lastUpdate)) {
                groups[key].lastUpdate = order.created_at;
            }
        });

        return Object.values(groups).sort((a, b) => {
            if (a.table !== b.table) return a.table - b.table;
            return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
        });
    }, [orders]);

    if (loading) return <LoadingSpinner message="Carregando lista de pedidos..." />;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-24 max-w-2xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight flex items-center">
                        <ClipboardList className="mr-2 text-primary" />
                        Pedidos Ativos
                    </h1>
                    <p className="text-xs text-text-secondary">Clique em uma mesa para gerenciar a comanda</p>
                </div>
                <button onClick={fetchOrders} className="p-2 bg-gray-800 rounded-full"><RefreshCw size={20} /></button>
            </header>

            <div className="relative w-full mb-8">
                <select 
                    value={selectedPlaceId} 
                    onChange={e => setSelectedPlaceId(e.target.value)} 
                    className="w-full p-4 bg-surface border border-gray-700 rounded-2xl appearance-none outline-none font-bold text-sm shadow-xl"
                >
                    {ownedPlaceIds.map(id => (
                        <option key={id} value={id}>{getPlaceById(id)?.name}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary" size={20} />
            </div>

            <div className="space-y-3">
                {groupedOrders.length === 0 ? (
                    <div className="text-center py-20 opacity-30">
                        <Bell size={48} className="mx-auto mb-4" />
                        <p className="font-bold">Nenhum pedido no momento.</p>
                    </div>
                ) : (
                    groupedOrders.map(group => (
                        <button
                            key={`${group.table}-${group.userId}`}
                            onClick={() => setSelectedComanda({ table: group.table, name: group.name, uid: group.userId })}
                            className="w-full bg-surface border border-gray-800 p-4 rounded-2xl flex items-center justify-between hover:border-accent/50 transition-all active:scale-[0.98] shadow-sm"
                        >
                            <div className="flex items-center">
                                <div className="bg-primary text-background font-black text-sm px-3 py-1.5 rounded-xl mr-4 shadow-md">
                                    MESA {group.table}
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-text-primary">{group.name}</h3>
                                    <p className="text-[10px] text-text-secondary font-medium">
                                        {group.orders.length} pedido(s) • R$ {group.total.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center text-accent">
                                {group.orders.some(o => o.status === 'pending') && (
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-3"></span>
                                )}
                                <ChevronRight size={20} />
                            </div>
                        </button>
                    ))
                )}
            </div>

            {selectedComanda && (
                <OwnerOrderDetailsModal 
                    tableNumber={selectedComanda.table}
                    customerName={selectedComanda.name}
                    orders={groupedOrders.find(g => g.table === selectedComanda.table && g.userId === selectedComanda.uid)?.orders || []}
                    onClose={() => setSelectedComanda(null)}
                    onUpdate={fetchOrders}
                />
            )}
        </div>
    );
};

export default OrderBoardPage;