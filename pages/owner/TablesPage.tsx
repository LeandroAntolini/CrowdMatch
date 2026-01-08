import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { QrCode, Plus, LayoutGrid, Users, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import OwnerOrderDetailsModal from '../../components/owner/OwnerOrderDetailsModal';
import { Order } from '../../types';

const TablesPage: React.FC = () => {
    const { ownedPlaceIds, getPlaceById } = useAppContext();
    const [selectedPlaceId, setSelectedPlaceId] = useState('');
    const [tables, setTables] = useState<any[]>([]);
    const [activeOrdersByTable, setActiveOrdersByTable] = useState<{ [key: number]: Order[] }>({});
    const [loading, setLoading] = useState(false);
    const [selectedTableForModal, setSelectedTableForModal] = useState<{ number: number; name: string; orders: Order[] } | null>(null);
    const navigate = useNavigate();

    // Sincroniza o ID selecionado com o primeiro local do lojista
    useEffect(() => {
        if (ownedPlaceIds.length > 0 && !selectedPlaceId) {
            setSelectedPlaceId(ownedPlaceIds[0]);
        }
    }, [ownedPlaceIds, selectedPlaceId]);

    const fetchData = useCallback(async () => {
        if (!selectedPlaceId) return;
        setLoading(true);
        
        try {
            // 1. Busca Mesas (Consulta simples para evitar erros de join)
            const { data: tablesData, error: tablesError } = await supabase
                .from('tables')
                .select('*')
                .eq('place_id', selectedPlaceId)
                .order('table_number', { ascending: true });
            
            if (tablesError) throw tablesError;

            // 2. Busca Pedidos Ativos (não pagos e não cancelados)
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*, order_items(*, menu_items(*)), profiles(name)')
                .eq('place_id', selectedPlaceId)
                .neq('status', 'paid')
                .neq('status', 'cancelled');
            
            if (ordersError) throw ordersError;

            setTables(tablesData || []);

            // Agrupa pedidos por número da mesa
            const grouped: { [key: number]: Order[] } = {};
            if (ordersData) {
                ordersData.forEach((order: any) => {
                    const tableNum = order.table_number;
                    if (!grouped[tableNum]) grouped[tableNum] = [];
                    grouped[tableNum].push(order);
                });
            }
            setActiveOrdersByTable(grouped);
        } catch (err) {
            console.error("Erro ao carregar dados das mesas:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedPlaceId]);

    useEffect(() => {
        fetchData();
        
        // Listener em tempo real para atualizações nas mesas e pedidos
        const channel = supabase.channel('table-page-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `place_id=eq.${selectedPlaceId}` }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `place_id=eq.${selectedPlaceId}` }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedPlaceId, fetchData]);

    const place = getPlaceById(selectedPlaceId);
    const isNightlife = place?.category === 'Boate' || place?.category === 'Casa de Shows' || place?.category === 'Espaço Musical';
    const labelSingular = isNightlife ? 'Comanda' : 'Mesa';
    const labelPlural = isNightlife ? 'Comandas' : 'Mesas';

    const handleTableClick = (table: any) => {
        const orders = activeOrdersByTable[table.table_number] || [];
        if (orders.length > 0) {
            setSelectedTableForModal({
                number: table.table_number,
                name: orders[0].profiles?.name || 'Cliente',
                orders: orders
            });
        }
    };

    return (
        <div className="p-6 space-y-6 pb-24">
            <div className="flex flex-col gap-4">
                <div className="bg-surface p-4 rounded-2xl border border-accent/20 flex items-center justify-between shadow-lg">
                    <div>
                        <h2 className="font-bold text-text-primary">QR Codes das {labelPlural}</h2>
                        <p className="text-xs text-text-secondary">Gere o PDF para impressão</p>
                    </div>
                    <button 
                        onClick={() => navigate('/owner/qrs')}
                        className="bg-accent text-white p-3 rounded-xl hover:bg-pink-600 transition-colors"
                    >
                        <QrCode size={20} />
                    </button>
                </div>

                <select 
                    value={selectedPlaceId}
                    onChange={(e) => setSelectedPlaceId(e.target.value)}
                    className="w-full p-3 bg-surface border border-gray-700 rounded-xl font-bold text-sm outline-none"
                >
                    {ownedPlaceIds.map(id => (
                        <option key={id} value={id}>{getPlaceById(id)?.name || `Local: ${id.substring(0, 5)}`}</option>
                    ))}
                </select>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black uppercase text-xs text-text-secondary tracking-widest">{labelPlural} ({tables.length})</h3>
                    <button onClick={() => navigate('/owner/qrs')} className="text-primary text-xs font-bold flex items-center">
                        <Plus size={14} className="mr-1" /> Editar
                    </button>
                </div>

                {loading && tables.length === 0 ? <LoadingSpinner /> : (
                    <div className="grid grid-cols-1 gap-3">
                        {tables.map(table => {
                            const orders = activeOrdersByTable[table.table_number] || [];
                            const hasOrders = orders.length > 0;
                            const hasPending = orders.some(o => o.status === 'pending');

                            return (
                                <div 
                                    key={table.id} 
                                    onClick={() => handleTableClick(table)}
                                    className={`bg-surface p-4 rounded-xl border flex items-center justify-between transition-all ${hasOrders ? 'border-accent/40 bg-accent/5 cursor-pointer' : 'border-gray-800'}`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black mr-4 border ${hasOrders ? 'bg-accent text-white border-accent' : 'bg-gray-800 text-primary border-primary/20'}`}>
                                            {table.table_number}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{labelSingular} {table.table_number}</p>
                                            <div className="flex items-center mt-1">
                                                {hasOrders ? (
                                                    <span className="text-[10px] text-green-400 font-bold flex items-center">
                                                        <Users size={10} className="mr-1" /> {orders[0]?.profiles?.name || 'Ocupada'}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Livre</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        {hasOrders ? (
                                            <div className="relative">
                                                <ClipboardList className={hasPending ? 'text-accent animate-pulse' : 'text-text-secondary'} size={24} />
                                                {hasPending && (
                                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-surface"></span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border border-gray-700"></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {tables.length === 0 && (
                             <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-gray-700">
                                <LayoutGrid size={40} className="mx-auto mb-2 opacity-20" />
                                <p className="text-text-secondary text-sm">Nenhuma {labelSingular.toLowerCase()} inicializada.</p>
                                <button onClick={() => navigate('/owner/qrs')} className="mt-4 text-accent font-bold text-xs underline">
                                    Configurar agora
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedTableForModal && (
                <OwnerOrderDetailsModal 
                    tableNumber={selectedTableForModal.number}
                    customerName={selectedTableForModal.name}
                    orders={selectedTableForModal.orders}
                    onClose={() => setSelectedTableForModal(null)}
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
};

export default TablesPage;