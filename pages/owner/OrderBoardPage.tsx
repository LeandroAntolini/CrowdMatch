import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { ClipboardList, CheckCircle, Clock, Utensils, Phone, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';

const OrderBoardPage: React.FC = () => {
    const { ownedPlaceIds } = useAppContext();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

        // Escuta por novos pedidos ou mudanças de status em tempo real
        const channel = supabase.channel('orders-updates')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'orders' 
            }, () => {
                fetchOrders();
            })
            .subscribe();
        
        return () => { supabase.removeChannel(channel); };
    }, [ownedPlaceIds]);

    const updateStatus = async (orderId: string, status: OrderStatus) => {
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId);

        if (updateError) {
            alert("Erro ao atualizar status: " + updateError.message);
        } else {
            fetchOrders();
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch(status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
            case 'preparing': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/50';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
        }
    };

    if (loading) return <LoadingSpinner message="Monitorando pedidos..." />;

    if (ownedPlaceIds.length === 0) {
        return (
            <div className="p-8 text-center text-text-secondary">
                <AlertTriangle size={48} className="mx-auto mb-4 text-yellow-500" />
                <p className="font-bold text-text-primary">Nenhum local configurado.</p>
                <p className="text-sm mt-2">Você precisa adicionar seus estabelecimentos em "Meus Locais" no Perfil para receber pedidos.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl font-bold flex items-center">
                <ClipboardList className="mr-2 text-primary" />
                Pedidos em Aberto
            </h1>

            {error && (
                <div className="bg-red-500/20 p-3 rounded-lg text-red-400 text-sm flex items-center">
                    <AlertTriangle size={16} className="mr-2" />
                    {error}
                </div>
            )}

            {orders.length === 0 ? (
                <div className="text-center py-20 text-text-secondary">
                    <Utensils size={64} className="mx-auto mb-4 opacity-20" />
                    <p>Nenhum pedido pendente no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {orders.map(order => (
                        <div key={order.id} className={`bg-surface border-l-4 rounded-xl p-4 shadow-lg ${getStatusColor(order.status)}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary">Mesa {order.table_number}</h2>
                                    <div className="flex items-center text-sm text-text-secondary">
                                        <span className="font-semibold text-text-primary mr-2">
                                            {order.profiles?.name || 'Cliente'}
                                        </span>
                                        {order.profiles?.phone && (
                                            <><Phone size={12} className="mr-1" /> {order.profiles.phone}</>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-text-primary">R$ {order.total_price.toFixed(2)}</div>
                                    <div className="text-xs opacity-70">{new Date(order.created_at).toLocaleTimeString()}</div>
                                </div>
                            </div>

                            <div className="bg-gray-800/50 rounded-lg p-3 mb-4 space-y-2">
                                {order.order_items?.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-text-primary">{item.quantity}x {item.menu_item?.name}</span>
                                        <span className="text-text-secondary">R$ {(item.quantity * item.unit_price).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {order.status === 'pending' && (
                                    <button onClick={() => updateStatus(order.id, 'preparing')} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold flex-1">
                                        Preparar
                                    </button>
                                )}
                                {order.status === 'preparing' && (
                                    <button onClick={() => updateStatus(order.id, 'delivered')} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold flex-1">
                                        Entregar
                                    </button>
                                )}
                                {order.status === 'delivered' && (
                                    <button onClick={() => updateStatus(order.id, 'paid')} className="bg-gray-200 text-black px-3 py-2 rounded-lg text-sm font-bold flex-1">
                                        Finalizar Conta
                                    </button>
                                )}
                                <button onClick={() => updateStatus(order.id, 'cancelled')} className="text-red-400 border border-red-400/30 px-3 py-2 rounded-lg text-sm">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderBoardPage;