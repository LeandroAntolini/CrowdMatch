import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { QrCode, Plus, LayoutGrid, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';

const TablesPage: React.FC = () => {
    const { ownedPlaceIds, getPlaceById } = useAppContext();
    const [selectedPlaceId, setSelectedPlaceId] = useState('');
    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Sincroniza o ID selecionado quando a lista de locais do lojista carregar
    useEffect(() => {
        if (ownedPlaceIds.length > 0 && !selectedPlaceId) {
            setSelectedPlaceId(ownedPlaceIds[0]);
        }
    }, [ownedPlaceIds, selectedPlaceId]);

    useEffect(() => {
        if (!selectedPlaceId) return;

        const fetchTables = async () => {
            setLoading(true);
            // Simplificamos a query removendo o join complexo para garantir que as mesas apareçam
            const { data, error } = await supabase
                .from('tables')
                .select('*')
                .eq('place_id', selectedPlaceId)
                .order('table_number', { ascending: true });
            
            if (error) {
                console.error("Erro ao buscar mesas:", error);
            } else {
                setTables(data || []);
            }
            setLoading(false);
        };

        fetchTables();
    }, [selectedPlaceId]);

    return (
        <div className="p-6 space-y-6 pb-24">
            <div className="flex flex-col gap-4">
                <div className="bg-surface p-4 rounded-2xl border border-accent/20 flex items-center justify-between shadow-lg">
                    <div>
                        <h2 className="font-bold text-text-primary">Impressão de QR Codes</h2>
                        <p className="text-xs text-text-secondary">Gere o PDF para as mesas</p>
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
                    <option value="" disabled>Selecione um estabelecimento</option>
                    {ownedPlaceIds.map(id => (
                        <option key={id} value={id}>{getPlaceById(id)?.name || `Local ID: ${id.substring(0, 5)}`}</option>
                    ))}
                </select>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black uppercase text-xs text-text-secondary tracking-widest">Mesas Configuradas ({tables.length})</h3>
                    <button onClick={() => navigate('/owner/qrs')} className="text-primary text-xs font-bold flex items-center">
                        <Plus size={14} className="mr-1" /> Editar Estrutura
                    </button>
                </div>

                {loading ? <LoadingSpinner /> : (
                    <div className="grid grid-cols-1 gap-3">
                        {tables.map(table => (
                            <div key={table.id} className="bg-surface p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center font-black text-primary mr-4 border border-primary/20">
                                        {table.table_number}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Mesa {table.table_number}</p>
                                        <div className="flex items-center mt-1">
                                            {table.current_user_id ? (
                                                <span className="text-[10px] text-green-400 font-bold flex items-center">
                                                    <Users size={10} className="mr-1" /> Cliente Ativo
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-gray-500 uppercase font-bold">Livre</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => navigate('/owner/qrs')}
                                        className="text-text-secondary p-2"
                                    >
                                        <QrCode size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {tables.length === 0 && !loading && (
                            <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-gray-700">
                                <LayoutGrid size={40} className="mx-auto mb-2 opacity-20" />
                                <p className="text-text-secondary text-sm">Nenhuma mesa configurada.</p>
                                <button 
                                    onClick={() => navigate('/owner/qrs')}
                                    className="mt-4 text-accent font-bold text-xs underline"
                                >
                                    Configurar mesas agora
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