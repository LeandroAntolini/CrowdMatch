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
    const { ownedPlaceIds, getPlaceById, activeOwnedPlaceId } = useAppContext();
    const [tables, setTables] = useState<TableRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTableData, setActiveTableData] = useState<{ tableNumber: number; customerName: string; orders: Order[] } | null>(null);
    const navigate = useNavigate();

    const fetchTables = useCallback(async () => {
        if (!activeOwnedPlaceId) return;
        
        try {
            const { data: tablesData, error: tablesError } = await supabase
                .from('tables')
                .select('*, profiles:current_user_id(name)')
                .eq('place_id', activeOwnedPlaceId)
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
                    .eq('place_id', activeOwnedPlaceId)
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
    }, [activeOwnedPlaceId]);

    useEffect(() => {
        fetchTables();
        const interval = setInterval(fetchTables, 10000);
        return () => clearInterval(interval);
    }, [fetchTables]);

    const releaseTable = async (tableNum: number) => {
        if (!window.confirm(`Liberar a mesa ${tableNum} manualmente?`)) return;
        
        const { error } = await supabase
            .from('tables')
            .update({ current_user_id: null })
            .eq('place_id', activeOwnedPlaceId)
            .eq('table_number', tableNum);
        
        if (error) toast.error("Erro ao liberar mesa.");
        else fetchTables();
    };

    const place = activeOwnedPlaceId ? getPlaceById(activeOwnedPlaceId) : null;
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
        const { error } = await supabase.from('tables').delete().eq('place_id', activeOwnedPlaceId);
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

    if (!activeOwnedPlaceId) return <div className="p-10 text-center opacity-50">Adicione um local para gerenciar.</div>;

    return (
        <div className="p-6 space-y-6 pb-24 bg-white min-h-full">
            <div className="flex flex-col gap-4">
                <div className="bg-secondary p-5 rounded-3xl border border-border-subtle flex items-center justify-between shadow-sm">
                    <div>
                        <h2 className="text-sm font-black text-text-primary uppercase tracking-tighter">Impressão de QRs</h2>
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">Gere os códigos das {labelPlural.toLowerCase()}</p>
                    </div>
                    <button onClick={() => navigate('/owner/qrs')} className="bg-text-primary text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform">
                        <QrCode size={20} />
                    </button>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-6 px-1">
                    <h3 className="text-[10px] font-black uppercase text-text-secondary tracking-[0.2em]">{labelPlural} Ativas ({tables.length})</h3>
                    <div className="flex gap-4">
                        {tables.length > 0 && (
                            <button onClick={deleteAllTables} disabled={isDeletingAll} className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline">
                                {isDeletingAll ? 'Limpando...' : 'Excluir Tudo'}
                            </button>
                        )}
                        <button onClick={() => navigate('/owner/qrs')} className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
                            <Plus size={12} className="inline mb-0.5 mr-1" /> Editar
                        </button>
                    </div>
                </div>

                {loading && tables.length === 0 ? <LoadingSpinner /> : (
                    <div className="space-y-2">
                        {tables.map(table => {
                            const isOccupied = !!table.current_user_id;
                            const hasActiveOrders = table.active_orders.length > 0;
                            return (
                                <div key={table.id} onClick={() => isOccupied && handleTableClick(table)} className={`bg-white p-4 rounded-2xl border flex items-center justify-between transition-all ${isOccupied ? 'border-primary/30 cursor-pointer shadow-sm' : 'border-border-subtle opacity-70'}`}>
                                    <div className="flex items-center">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black mr-4 text-lg ${isOccupied ? 'bg-primary/10 text-primary' : 'bg-secondary text-text-secondary'}`}>
                                            {table.table_number}
                                        </div>
                                        <div>
                                            <p className="font-black text-text-primary tracking-tight">{labelSingular} {table.table_number}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${isOccupied ? 'text-green-600' : 'text-text-secondary opacity-50'}`}>
                                                {isOccupied ? table.profiles?.name || 'Ocupada' : 'Livre'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {hasActiveOrders && (
                                            <span className="text-[8px] font-black text-white bg-accent px-2 py-1 rounded-full animate-pulse uppercase tracking-widest">
                                                {table.active_orders.length} Pedidos
                                            </span>
                                        )}
                                        {isOccupied ? (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); releaseTable(table.table_number); }} 
                                                className="text-text-secondary p-2 hover:text-red-500"
                                            >
                                                <LogOut size={18} />
                                            </button>
                                        ) : (
                                            <button onClick={(e) => { e.stopPropagation(); deleteIndividualTable(table.id, table.table_number); }} className="text-text-secondary p-2 hover:text-red-500 opacity-50">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {tables.length === 0 && !loading && (
                            <div className="text-center py-20 opacity-30 flex flex-col items-center">
                                <LayoutGrid size={48} className="mb-4" />
                                <p className="font-black uppercase tracking-widest text-[10px]">Nenhuma mesa configurada</p>
                            </div>
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