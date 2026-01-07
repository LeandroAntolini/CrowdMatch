import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order } from '../../types';
import { ClipboardList, RefreshCw, ChevronDown, User, Coffee, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import OwnerOrderDetailsModal from '../../components/owner/OwnerOrderDetailsModal';
import { toast } from 'react-hot-toast';

interface TableState {
    table_number: number;
    current_user_id: string | null;
    profiles?: { name: string };
}

const OrderBoardPage: React.FC = () => {
    const { ownedPlaceIds, getPlaceById } = useAppContext();
    const [selectedPlaceId, setSelectedPlaceId] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [tables, setTables] = useState<TableState[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedComanda, setSelectedComanda] = useState<{ table: number, name: string, uid: string } | null>(null);

    useEffect(() => {
        if (ownedPlaceIds.length > 0 && !selectedPlaceId) setSelectedPlaceId(ownedPlaceIds[0]);
    }, [ownedPlaceIds, selectedPlaceId]);

    const fetchData = useCallback(async () => {
        if (!selectedPlaceId) return;
        
        const [ordersRes, tablesRes] = await Promise.all([
            supabase
                .from('orders')
                .select('*, order_items(*, menu_items(*)), profiles(name, phone)')
                .eq('place_id', selectedPlaceId)
                .neq('status', 'paid')
                .neq('status', 'cancelled'),
            supabase
                .from('tables')
                // Alterado para usar a relação 'profiles' via 'current_user_id'
                .select('table_number, current_user_id, profiles!tables_current_user_id_fkey(name)') 
                .eq('place_id', selectedPlaceId)
                .order('table_number', { ascending: true })
        ]);
        
        if (!ordersRes.error) setOrders(ordersRes.data || []);
        
        // O Supabase usa o nome da FK para o join se não for a PK.
        // A FK é tables_current_user_id_fkey.
        if (!tablesRes.error) {
            // Mapeamos os dados para o tipo TableState, ajustando o nome da propriedade do join
            const mappedTables = (tablesRes.data || []).map((t: any) => ({
                table_number: t.table_number,
                current_user_id: t.current_user_id,
                profiles: t.profiles, // O nome da propriedade é 'profiles'
            }));
            setTables(mappedTables);
        }
        setLoading(false);
    }, [selectedPlaceId]);

    useEffect(() => {
        if (!selectedPlaceId) return;
        fetchData();

        const ordersChannel = supabase.channel(`orders-${selectedPlaceId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `place_id=eq.${selectedPlaceId}` }, () => fetchData())
            .subscribe();
            
        const tablesChannel = supabase.channel(`tables-${selectedPlaceId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `place_id=eq.${selectedPlaceId}` }, () => fetchData())
            .subscribe();

        return () => { 
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(tablesChannel);
        };
    }, [selectedPlaceId, fetchData]);

    // Mesclar mesas e pedidos
    const tableMap = useMemo(() => {
        const map: { [key: number]: { table: number, user: string | null, userName: string, hasOrder: boolean, pendingOrder: boolean, orders: Order[], total: number } } = {};
        
        // Inicializa todas as mesas cadastradas como inativas
        tables.forEach(t => {
            map[t.table_number] = {
                table: t.table_number,
                user: t.current_user_id,
                // O nome do perfil vem do join, se existir
                userName: t.profiles?.name || '', 
                hasOrder: false,
                pendingOrder: false,
                orders: [],
                total: 0
            };
        });

        // Adiciona pedidos às mesas
        orders.forEach(order => {
            if (map[order.table_number]) {
                map[order.table_number].hasOrder = true;
                map[order.table_number].orders.push(order);
                map[order.table_number].total += order.total_price;
                if (order.status === 'pending') map[order.table_number].pendingOrder = true;
                // Se a mesa estiver sem nome (usuário não logado ou perfil não carregado), 
                // mas tiver pedido, pega o nome do perfil do pedido (que tem RLS diferente)
                if (!map[order.table_number].userName) map[order.table_number].userName = order.profiles?.name || 'Cliente';
            }
        });

        return Object.values(map).sort((a, b) => a.table - b.table);
    }, [tables, orders]);

    if (loading) return <LoadingSpinner message="Abrindo o mapa de mesas..." />;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-24">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight flex items-center">
                        <ClipboardList className="mr-2 text-primary" />
                        Mapa de Mesas
                    </h1>
                </div>
                <button onClick={fetchData} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
                    <RefreshCw size={20} />
                </button>
            </header>

            <div className="relative w-full mb-8 max-w-xs">
                <select 
                    value={selectedPlaceId} 
                    onChange={e => setSelectedPlaceId(e.target.value)} 
                    className="w-full p-3 bg-surface border border-gray-700 rounded-xl outline-none font-bold text-sm"
                >
                    {ownedPlaceIds.map(id => (
                        <option key={id} value={id}>{getPlaceById(id)?.name}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary" size={16} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tableMap.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-40">
                        <Coffee size={48} className="mx-auto mb-4" />
                        <p className="font-bold">Nenhuma mesa configurada.</p>
                        <p className="text-xs">Vá em "Perfil &gt; QR das Mesas" para inicializar seu salão.</p>
                    </div>
                ) : (
                    tableMap.map(m => {
                        // Lógica de cores baseada no estado
                        let bgColor = "bg-gray-800/30 border-gray-800 text-gray-600"; // Inativa
                        let iconColor = "text-gray-700";
                        
                        if (m.user || m.hasOrder) {
                            bgColor = "bg-surface border-primary/50 text-text-primary shadow-lg"; // Ocupada/Ativa
                            iconColor = "text-primary";
                        }
                        
                        if (m.hasOrder) {
                            bgColor = "bg-surface border-accent text-text-primary shadow-xl ring-1 ring-accent/30"; // Com pedido
                            iconColor = "text-accent";
                        }

                        if (m.pendingOrder) {
                            bgColor = "bg-accent text-white shadow-2xl animate-pulse"; // Pedido Pendente (Urgente)
                            iconColor = "text-white";
                        }

                        return (
                            <button
                                key={m.table}
                                onClick={() => (m.user || m.hasOrder) && setSelectedComanda({ table: m.table, name: m.userName, uid: m.user || m.orders[0]?.user_id })}
                                className={`${bgColor} border-2 p-4 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 min-h-[120px] relative overflow-hidden`}
                            >
                                <span className="absolute top-2 left-3 font-black text-lg opacity-50">{m.table}</span>
                                
                                {m.pendingOrder ? <AlertCircle size={28} className="mb-2" /> : <User size={24} className={`${iconColor} mb-2`} />}
                                
                                <span className="text-[10px] font-bold uppercase truncate w-full text-center">
                                    {m.userName || 'Livre'}
                                </span>
                                
                                {m.total > 0 && (
                                    <span className="mt-1 text-[10px] font-black px-2 py-0.5 bg-black/20 rounded-full">
                                        R$ {m.total.toFixed(2)}
                                    </span>
                                )}
                            </button>
                        );
                    })
                )}
            </div>

            {selectedComanda && (
                <OwnerOrderDetailsModal 
                    tableNumber={selectedComanda.table}
                    customerName={selectedComanda.name}
                    orders={tableMap.find(m => m.table === selectedComanda.table)?.orders || []}
                    onClose={() => setSelectedComanda(null)}
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
};

export default OrderBoardPage;