import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { ClipboardList, Clock, Utensils, User as UserIcon, Bell, ChevronDown } from 'lucide-react';
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
        
        if (!error) setOrders(data || []);
        setLoading(false);
    }, [selectedPlaceId]);

    useEffect(() => {
        if (!selectedPlaceId) return;
        fetchOrders();

        const channel = supabase.channel(`orders-${selectedPlaceId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `place_id=eq.${selectedPlaceId}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    toast.success("Novo pedido!", { icon: '🔔' });
                    new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(()=>{});
                }
                fetchOrders();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedPlaceId, fetchOrders]);

    const updateStatus = async (id: string, status: OrderStatus) => {
        await supabase.from('orders').update({ status }).eq('id', id);
        // O real-time atualizará a lista
    };

    const grouped = useMemo(() => {
        const tables: any = {};
        orders.forEach(o => {
            if (!tables[o.table_number]) tables[o.table_number] = {};
            if (!tables[o.table_number][o.user_id]) {
                tables[o.table_number][o.user_id] = { name: o.profiles?.name || 'Cliente', phone: o.profiles?.phone || '', orders: [], total: 0 };
            }
            tables[o.table_number][o.user_id].orders.push(o);
            tables[o.table_number][o.user_id].total += o.total_price;
        });
        return tables;
    }, [orders]);

    if (loading) return <LoadingSpinner message="Sincronizando pedidos..." />;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold flex items-center"><ClipboardList className="mr-2 text-primary" /> Painel de Pedidos</h1>
                <div className="relative w-full md:w-64">
                    <select value={selectedPlaceId} onChange={e => setSelectedPlaceId(e.target.value)} className="w-full p-3 bg-surface border border-gray-700 rounded-xl appearance-none outline-none font-bold">
                        {ownedPlaceIds.map(id => <option key={id} value={id}>{getPlaceById(id)?.name || "Local"}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(grouped).map(([table, users]: any) => (
                    <div key={table} className="space-y-4">
                        <div className="bg-gray-800 p-3 rounded-xl border-l-4 border-accent shadow-sm"><h2 className="text-xl font-black">MESA {table}</h2></div>
                        {Object.entries(users).map(([uid, data]: any) => (
                            <div key={uid} className="bg-surface rounded-xl overflow-hidden border border-gray-700">
                                <div className="bg-gray-800/50 p-3 flex justify-between items-center border-b border-gray-700">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mr-2"><UserIcon size={16} className="text-accent" /></div>
                                        <div className="text-xs"><strong>{data.name}</strong><p className="text-text-secondary">{data.phone}</p></div>
                                    </div>
                                    <div className="text-right text-sm font-black text-primary">R$ {data.total.toFixed(2)}</div>
                                </div>
                                <div className="p-3 space-y-3">
                                    {data.orders.map((o: Order) => (
                                        <div key={o.id} className={`p-3 rounded-lg border-l-4 ${o.status === 'pending' ? 'border-yellow-500' : 'border-blue-500'}`}>
                                            <div className="flex justify-between text-[10px] uppercase font-bold mb-2"><span>{new Date(o.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span><span className="text-accent">R$ {o.total_price.toFixed(2)}</span></div>
                                            <div className="text-xs space-y-1 mb-3">{o.order_items?.map(i => <div key={i.id} className="flex justify-between"><span>{i.quantity}x {i.menu_item?.name}</span></div>)}</div>
                                            <div className="flex gap-2">
                                                {o.status === 'pending' && <button onClick={() => updateStatus(o.id, 'preparing')} className="bg-blue-600 text-white p-2 rounded flex-1 text-[10px] font-bold">PREPARAR</button>}
                                                {o.status === 'preparing' && <button onClick={() => updateStatus(o.id, 'delivered')} className="bg-green-600 text-white p-2 rounded flex-1 text-[10px] font-bold">ENTREGAR</button>}
                                                {o.status === 'delivered' && <button onClick={() => updateStatus(o.id, 'paid')} className="bg-gray-700 text-white p-2 rounded flex-1 text-[10px] font-bold">PAGO</button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrderBoardPage;