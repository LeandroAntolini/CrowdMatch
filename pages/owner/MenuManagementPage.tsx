import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { MenuItem } from '../../types';
import { Plus, Edit, Trash2, Utensils, Save, X, Loader2, UploadCloud } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const MenuManagementPage: React.FC = () => {
    const { ownedPlaceIds, getPlaceById, currentUser } = useAppContext();
    const [selectedPlaceId, setSelectedPlaceId] = useState('');
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (ownedPlaceIds.length > 0 && !selectedPlaceId) {
            setSelectedPlaceId(ownedPlaceIds[0]);
        }
    }, [ownedPlaceIds, selectedPlaceId]);

    useEffect(() => {
        if (!selectedPlaceId) return;

        const fetchMenu = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .eq('place_id', selectedPlaceId)
                .order('category', { ascending: true });
            
            if (data) setMenuItems(data);
            setLoading(false);
        };

        fetchMenu();
    }, [selectedPlaceId]);

    const handleEditClick = (item: MenuItem) => {
        setEditingItem(item);
    };

    const handleNewClick = () => {
        setEditingItem({ 
            name: '', 
            price: 0, 
            category: 'Comida', 
            description: '', 
            image_url: '',
            is_available: true
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !currentUser) return;

        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecione um arquivo de imagem.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('O arquivo é muito grande. O limite é de 5MB.');
            return;
        }

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const filePath = `${currentUser.id}/menu/${Date.now()}.${fileExt}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('feed_media') // Reutilizando o bucket de mídias de lojistas
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('feed_media').getPublicUrl(filePath);

            if (publicUrl) {
                setEditingItem(prev => prev ? { ...prev, image_url: publicUrl } : null);
                toast.success("Imagem enviada com sucesso!");
            } else {
                throw new Error("Não foi possível obter a URL pública.");
            }
        } catch (error: any) {
            console.error("Erro ao enviar imagem:", error);
            toast.error(`Falha no upload: ${error.message}`);
        } finally {
            setUploading(false);
            if (e.target) e.target.value = ''; // Limpa o input
        }
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || !selectedPlaceId || isSaving) return;
        
        if (!editingItem.name || !editingItem.price || !editingItem.category) {
            toast.error("Nome, preço e categoria são obrigatórios.");
            return;
        }

        setIsSaving(true);

        const payload = {
            ...editingItem,
            place_id: selectedPlaceId,
            is_available: editingItem.is_available ?? true,
            price: parseFloat(editingItem.price as any) // Garante que o preço é um número
        };

        let error;
        if (editingItem.id) {
            const { error: err } = await supabase.from('menu_items').update(payload).eq('id', editingItem.id);
            error = err;
        } else {
            const { error: err } = await supabase.from('menu_items').insert(payload);
            error = err;
        }

        if (!error) {
            toast.success(`Item ${editingItem.id ? 'atualizado' : 'criado'} com sucesso!`);
            // Refresh menu
            const { data } = await supabase.from('menu_items').select('*').eq('place_id', selectedPlaceId).order('category', { ascending: true });
            if (data) setMenuItems(data);
            setEditingItem(null);
        } else {
            toast.error("Erro ao salvar: " + error.message);
        }
        setIsSaving(false);
    };

    const deleteItem = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir este item?")) return;
        const { error } = await supabase.from('menu_items').delete().eq('id', id);
        if (!error) {
            toast.success("Item excluído.");
            setMenuItems(prev => prev.filter(item => item.id !== id));
        } else {
            toast.error("Erro ao excluir: " + error.message);
        }
    };

    if (ownedPlaceIds.length === 0) {
        return <div className="p-6 text-center">Adicione um local primeiro.</div>;
    }

    return (
        <div className="p-6">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg" disabled={uploading} />
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestão de Cardápio</h1>
                <button 
                    onClick={handleNewClick}
                    className="bg-accent text-white p-2 rounded-lg flex items-center"
                >
                    <Plus size={20} className="mr-1" /> Novo Item
                </button>
            </div>

            <select 
                value={selectedPlaceId}
                onChange={(e) => setSelectedPlaceId(e.target.value)}
                className="w-full mb-6 p-2 bg-surface border border-gray-600 rounded-lg"
            >
                {ownedPlaceIds.map(id => (
                    <option key={id} value={id}>{getPlaceById(id)?.name}</option>
                ))}
            </select>

            {loading ? <LoadingSpinner /> : (
                <div className="space-y-4">
                    {menuItems.map(item => (
                        <div key={item.id} className="bg-surface p-4 rounded-xl flex items-center">
                            <img src={item.image_url || 'https://picsum.photos/seed/food/100/100'} className="w-12 h-12 rounded object-cover mr-4" />
                            <div className="flex-grow">
                                <h3 className="font-bold">{item.name}</h3>
                                <p className="text-xs text-text-secondary">{item.category} • R$ {item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => handleEditClick(item)} className="text-text-secondary hover:text-primary"><Edit size={20} /></button>
                                <button onClick={() => deleteItem(item.id)} className="text-text-secondary hover:text-red-500"><Trash2 size={20} /></button>
                            </div>
                        </div>
                    ))}
                    {menuItems.length === 0 && <p className="text-center text-text-secondary py-10">Seu cardápio está vazio.</p>}
                </div>
            )}

            {editingItem && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface w-full max-w-md rounded-2xl p-6 relative">
                        <button onClick={() => setEditingItem(null)} className="absolute top-4 right-4 text-text-secondary"><X size={24} /></button>
                        <h2 className="text-xl font-bold mb-4">{editingItem.id ? 'Editar Item' : 'Novo Item'}</h2>
                        
                        <form onSubmit={handleSaveItem} className="space-y-4">
                            
                            {/* Campo de Upload de Imagem */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Foto do Produto (Opcional)</label>
                                {editingItem.image_url ? (
                                    <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2">
                                        <img src={editingItem.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => setEditingItem(prev => prev ? { ...prev, image_url: '' } : null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-32 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-text-secondary cursor-pointer hover:bg-gray-800"
                                    >
                                        {uploading ? (
                                            <Loader2 size={24} className="animate-spin" />
                                        ) : (
                                            <>
                                                <UploadCloud size={32} />
                                                <p className="mt-1 text-sm">Clique para enviar</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm text-text-secondary mb-1">Nome</label>
                                <input 
                                    type="text" 
                                    value={editingItem.name || ''} 
                                    onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                                    required
                                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-text-secondary mb-1">Preço (R$)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={editingItem.price || 0} 
                                        onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                                        required
                                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-text-secondary mb-1">Categoria</label>
                                    <select 
                                        value={editingItem.category || 'Comida'} 
                                        onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
                                    >
                                        <option value="Comida">Comida</option>
                                        <option value="Bebida">Bebida</option>
                                        <option value="Sobremesa">Sobremesa</option>
                                        <option value="Dose">Dose</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-text-secondary mb-1">Descrição</label>
                                <textarea 
                                    value={editingItem.description || ''} 
                                    onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
                                    rows={2}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSaving || uploading}
                                className="w-full bg-accent py-3 rounded-lg font-bold flex items-center justify-center"
                            >
                                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                Salvar Item
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuManagementPage;