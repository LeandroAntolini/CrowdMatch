import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { QrCode, Plus, LayoutGrid, Users, Trash2, Loader2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import OwnerOrderDetailsModal from '../../components/owner/OwnerOrderDetailsModal';
import { Order } from '../../types';

interface TableRecord {
    id: string;
    place_id: string;
    table_number: number;
    current_user_id: string | null;
    last_activity: string;
    profiles?: { name: string } | null;
    active_orders: Order[];
}

const TablesPage: React.FC = () => {
    const { ownedPlaceIds, getPlaceById } = useAppContext();
    const [selectedPlaceId, setSelectedPlaceId] = useState(ownedPlaceIds[0] || '');
    const [tables, setTables] = useState<TableRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTableData, setActiveTableData] = useState<{ tableNumber: number; customerName: string; orders: Order[] } | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (ownedPlaceIds.length > 0 && !selectedPlaceId) {
            setSelectedPlaceId(ownedPlaceIds[0]);
        }
    }, [ownedPlaceIds, selectedPlaceId]);

    const fetchTables = useCallback(async () => {
        if (!selectedPlaceId) return;
        
        try {
            const { data: tablesData, error: tablesError } = await supabase
                .from('tables')
                .select('*, profiles:current_user_id(name)')
                .eq('place_id', selectedPlaceId)
                .order('table_number', { ascending: true });
            
            if (tablesError) throw tablesError;

            const tablesWithUsers: TableRecord[] = (tablesData || []).map(t => ({
                ...t,
                profiles: t.profiles as { name: string } | null,
                active_orders: [], 
            }));

            const occupiedUserIds = tablesWithUsers
                .filter(t => t.current_user_id)
                .map(t => t.current_user_id) as string[];
            
            if (occupiedUserIds.length > 0) {
                const { data: ordersData, error: ordersError } = await supabase
                    .from('orders')
                    .select('*, order_items(*, menu_items(*))')
                    .eq('place_id', selectedPlaceId)
                    .in('user_id', occupiedUserIds)
                    .not('status', 'in', '("paid", "cancelled")')
                    .order('created_at', { ascending: false });

                if (!ordersError && ordersData) {
                    const ordersByUser: { [userId: string]: Order[] } = ordersData.reduce((acc, order) => {
                        const userId = order.user_id;
                        acc[userId] = acc[userId] || [];
                        acc[userId].push(order as Order);
                        return acc;
                    }, {} as any);

                    tablesWithUsers.forEach(table => {
                        if (table.current_user_id && ordersByUser[table.current_user_id]) {
                            table.active_orders = ordersByUser[table.current_user_id];
                        }
                    });
                }
            }

            setTables(tablesWithUsers);
        } catch (error: any) {
            console.error("Erro ao carregar mesas:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedPlaceId]);

    useEffect(() => {
        fetchTables();
        const interval = setInterval(fetchTables, 10000);
        return () => clearInterval(interval);
    }, [fetchTables]);

    const releaseTable = async (tableNum: number) => {
        if (!window.confirm(`Liberar a mesa ${tableNum} manualmente? Isso removerá o acesso do cliente atual.`)) return;
        
        const { error } = await supabase
            .from('tables')
            .update({ current_user_id: null })
            .eq('place_id', selectedPlaceId)
            .eq('table_number', tableNum);
        
        if (error) {
            toast.error("Erro ao liberar mesa.");
        } else {
            toast.success("Mesa liberada.");
            fetchTables();
        }
    };

    const place = getPlaceById(selectedPlaceId);
    const isNightlife = place?.category === 'Boate' || place?.category === 'Casa de Shows' || place?.category === 'Espaço Musical';
    const labelSingular = isNightlife ? 'Comanda' : 'Mesa';
    const labelPlural = isNightlife ? 'Comandas' : 'Mesas';

    const deleteIndividualTable = async (tableId: string, tableNum: number) => {
        if (!window.confirm(`Excluir a estrutura da ${labelSingular} ${tableNum}?`)) return;
        const { error } = await supabase.from('tables').delete().eq('id', tableId);
        if (error) toast.error("Erro ao excluir.");
        else fetchTables();
    };

    const deleteAllTables = async () => {
        if (!window.confirm(`Excluir TODAS as ${labelPlural.toLowerCase()}?`)) return;
        setIsDeletingAll(true);
        const { error } = await supabase.from('tables').delete().eq('place_id', selectedPlaceId);
        if (error) toast.error("Erro ao limpar.");
        else setTables([]);
        setIsDeletingAll(false);
    };
    
    const handleTableClick = (table: TableRecord) => {
        if (table.current_user_id && table.profiles) {
            setActiveTableData({
                tableNumber: table.table_number,
                customerName: table.profiles.name,
                orders: table.active_orders,
            });
            setIsModalOpen(true);
        }
    };

    return (
        <div className="p-6 space-y-6 pb-24">
            <div className="flex flex-col gap-4">
                <div className="bg-surface p-4 rounded-2xl border border-accent/20 flex items-center justify-between shadow-lg">
                    <div>
                        <h2 className="font-bold text-text-primary">Impressão de QRs</h2>
                        <p className="text-xs text-text-secondary">Gere o PDF para as {labelPlural.toLowerCase()}</p>
                    </div>
                    <button onClick={() => navigate('/owner/qrs')} className="bg-accent text-white p-3 rounded-xl hover:bg-pink-600 transition-colors">
                        <QrCode size={20} />
                    </button>
                </div>

                <select 
                    value={selectedPlaceId}
                    onChange={(e) => setSelectedPlaceId(e.target.value)}
                    className="w-full p-3 bg-surface border border-gray-700 rounded-xl font-bold text-sm outline-none"
                >
                    {ownedPlaceIds.map(id => (
                        <option key={id} value={id}>{getPlaceById(id)?.name || id}</option>
                    ))}
                </select>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black uppercase text-xs text-text-secondary tracking-widest">{labelPlural} ({tables.length})</h3>
                    <div className="flex gap-3">
                        {tables.length > 0 && (
                            <button onClick={deleteAllTables} disabled={isDeletingAll} className="text-red-400 text-xs font-bold flex items-center">
                                {isDeletingAll ? <Loader2 size={14} className="animate-spin mr-1" /> : <Trash2 size={14} className="mr-1" />}
                                Limpar Estrutura
                            </button>
                        )}
                        <button onClick={() => navigate('/owner/qrs')} className="text-primary text-xs font-bold flex items-center">
                            <Plus size={14} className="mr-1" /> Editar
                        </button>
                    </div>
                </div>

                {loading && tables.length === 0 ? <LoadingSpinner /> : (
                    <div className="grid grid-cols-1 gap-3">
                        {tables.map(table => {
                            const isOccupied = !!table.current_user_id;
                            const hasActiveOrders = table.active_orders.length > 0;
                            return (
                                <div key={table.id} onClick={() => isOccupied && handleTableClick(table)} className={`bg-surface p-4 rounded-xl border border-gray-800 flex items-center justify-between transition-colors ${isOccupied ? 'cursor-pointer hover:border-accent/50' : 'hover:border-gray-700'}`}>
                                    <div className="flex items-center">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black mr-4 border ${isOccupied ? 'bg-accent/10 text-accent border-accent/20' : 'bg-gray-800 text-primary border-primary/20'}`}>
                                            {table.table_number}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{labelSingular} {table.table_number}</p>
                                            <p className={`text-[10px] font-bold ${isOccupied ? 'text-green-400' : 'text-gray-500 uppercase'}`}>
                                                {isOccupied ? `Ocupada por ${table.profiles?.name || '...'}` : 'Livre'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {hasActiveOrders && <span className="text-[10px] font-black text-white bg-red-500 px-2 py-1 rounded-full animate-pulse">{table.active_orders.length} PEDIDOS</span>}
                                        {isOccupied && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); releaseTable(table.table_number); }} 
                                                className="text-text-secondary p-2 hover:text-red-500"
                                                title="Liberar Mesa"
                                            >
                                                <LogOut size={18} />
                                            </button>
                                        )}
                                        {!isOccupied && (
                                            <button onClick={(e) => { e.stopPropagation(); deleteIndividualTable(table.id, table.table_number); }} className="text-text-secondary p-2 hover:text-red-500">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {tables.length === 0 && !loading && (
                            <div className="text-center py-10 opacity-50"><LayoutGrid size={48} className="mx-auto mb-2" /><p>Nenhuma mesa configurada.</p></div>
                        )}
                    </div>
                )}
            </div>
            
            {isModalOpen && activeTableData && (
                <OwnerOrderDetailsModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onUpdate={fetchTables}
                    tableNumber={activeTableData.tableNumber}
                    customerName={activeTableData.customerName}
                    orders={activeTableData.orders}
                />
            )}
        </div>
    );
};

export default TablesPage;