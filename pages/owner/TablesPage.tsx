import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { QrCode, Plus, LayoutGrid, Users, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const TablesPage: React.FC = () => {
    const { ownedPlaceIds, getPlaceById } = useAppContext();
    const [selectedPlaceId, setSelectedPlaceId] = useState(ownedPlaceIds[0] || '');
    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const navigate = useNavigate();

    const fetchTables = useCallback(async () => {
        if (!selectedPlaceId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('tables')
            .select('*')
            .eq('place_id', selectedPlaceId)
            .order('table_number', { ascending: true });
        
        if (error) {
            console.error("Erro ao buscar mesas:", error);
            toast.error("Erro ao carregar mesas.");
        } else {
            setTables(data || []);
        }
        setLoading(false);
    }, [selectedPlaceId]);

    useEffect(() => {
        if (ownedPlaceIds.length > 0 && !selectedPlaceId) {
            setSelectedPlaceId(ownedPlaceIds[0]);
        }
    }, [ownedPlaceIds, selectedPlaceId]);

    useEffect(() => {
        fetchTables();
    }, [fetchTables]);

    const place = getPlaceById(selectedPlaceId);
    const isNightlife = place?.category === 'Boate' || place?.category === 'Casa de Shows' || place?.category === 'Espaço Musical';
    const labelSingular = isNightlife ? 'Comanda' : 'Mesa';
    const labelPlural = isNightlife ? 'Comandas' : 'Mesas';

    const deleteIndividualTable = async (tableId: string, tableNum: number) => {
        if (!window.confirm(`Tem certeza que deseja excluir a ${labelSingular} ${tableNum}?`)) return;
        
        const { error } = await supabase
            .from('tables')
            .delete()
            .eq('id', tableId);

        if (error) {
            toast.error("Erro ao excluir mesa.");
        } else {
            toast.success(`${labelSingular} excluída.`);
            setTables(prev => prev.filter(t => t.id !== tableId));
        }
    };

    const deleteAllTables = async () => {
        if (!window.confirm(`ATENÇÃO: Isso excluirá TODAS as ${labelPlural.toLowerCase()} deste estabelecimento. Esta ação não pode ser desfeita. Deseja continuar?`)) return;
        
        setIsDeletingAll(true);
        const { error } = await supabase
            .from('tables')
            .delete()
            .eq('place_id', selectedPlaceId);

        if (error) {
            toast.error("Erro ao limpar mesas.");
        } else {
            toast.success(`Todas as ${labelPlural.toLowerCase()} foram removidas.`);
            setTables([]);
        }
        setIsDeletingAll(false);
    };

    return (
        <div className="p-6 space-y-6 pb-24">
            <div className="flex flex-col gap-4">
                <div className="bg-surface p-4 rounded-2xl border border-accent/20 flex items-center justify-between shadow-lg">
                    <div>
                        <h2 className="font-bold text-text-primary">Impressão de QRs</h2>
                        <p className="text-xs text-text-secondary">Gere o PDF para as {labelPlural.toLowerCase()}</p>
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
                        <option key={id} value={id}>{getPlaceById(id)?.name || `Local ID: ${id.substring(0, 5)}`}</option>
                    ))}
                </select>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black uppercase text-xs text-text-secondary tracking-widest">{labelPlural} Configuradas ({tables.length})</h3>
                    <div className="flex gap-3">
                        {tables.length > 0 && (
                            <button 
                                onClick={deleteAllTables}
                                disabled={isDeletingAll}
                                className="text-red-400 text-xs font-bold flex items-center hover:text-red-300 transition-colors"
                            >
                                {isDeletingAll ? <Loader2 size={14} className="animate-spin mr-1" /> : <Trash2 size={14} className="mr-1" />}
                                Limpar Tudo
                            </button>
                        )}
                        <button onClick={() => navigate('/owner/qrs')} className="text-primary text-xs font-bold flex items-center">
                            <Plus size={14} className="mr-1" /> Editar Estrutura
                        </button>
                    </div>
                </div>

                {loading ? <LoadingSpinner /> : (
                    <div className="grid grid-cols-1 gap-3">
                        {tables.map(table => (
                            <div key={table.id} className="bg-surface p-4 rounded-xl border border-gray-800 flex items-center justify-between hover:border-gray-700 transition-colors">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center font-black text-primary mr-4 border border-primary/20">
                                        {table.table_number}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{labelSingular} {table.table_number}</p>
                                        <div className="flex items-center mt-1">
                                            {table.current_user_id ? (
                                                <span className="text-[10px] text-green-400 font-bold flex items-center">
                                                    <Users size={10} className="mr-1" /> Ocupada
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-gray-500 uppercase font-bold">Livre</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => navigate('/owner/qrs')}
                                        className="text-text-secondary p-2 hover:text-accent transition-colors"
                                        title="Ver QR Code"
                                    >
                                        <QrCode size={18} />
                                    </button>
                                    <button 
                                        onClick={() => deleteIndividualTable(table.id, table.table_number)}
                                        className="text-text-secondary p-2 hover:text-red-500 transition-colors"
                                        title="Excluir mesa"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {tables.length === 0 && (
                            <div className="text-center py-12 bg-surface/50 rounded-2xl border border-dashed border-gray-700 flex flex-col items-center">
                                <LayoutGrid size={48} className="text-gray-600 mb-3 opacity-20" />
                                <p className="text-text-secondary font-medium">Nenhuma mesa configurada.</p>
                                <p className="text-xs text-gray-500 mt-1 mb-4">Clique em "Editar Estrutura" para começar.</p>
                                <button 
                                    onClick={() => navigate('/owner/qrs')}
                                    className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors"
                                >
                                    Começar Configuração
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TablesPage;