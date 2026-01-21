import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { MenuItem } from '../../types';
import { Plus, Edit, Trash2, Utensils, Save, X, Loader2, UploadCloud } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const MenuManagementPage: React.FC = () => {
    const { currentUser, activeOwnedPlaceId } = useAppContext();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!activeOwnedPlaceId) return;

        const fetchMenu = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .eq('place_id', activeOwnedPlaceId)
                .order('category', { ascending: true });
            
            if (data) setMenuItems(data);
            setLoading(false);
        };

        fetchMenu();
    }, [activeOwnedPlaceId]);

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
            toast.error('Por favor, selecione uma imagem.');
            return;
        }

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const filePath = `${currentUser.id}/menu/${Date.now()}.${fileExt}`;

        try {
            const { error: uploadError } = await supabase.storage.from('feed_media').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('feed_media').getPublicUrl(filePath);
            setEditingItem(prev => prev ? { ...prev, image_url: publicUrl } : null);
            toast.success("Imagem carregada!");
        } catch (error: any) {
            toast.error("Erro no upload.");
        } finally {
            setUploading(false);
        }
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || !activeOwnedPlaceId || isSaving) return;
        
        setIsSaving(true);
        const payload = {
            ...editingItem,
            place_id: activeOwnedPlaceId,
            is_available: editingItem.is_available ?? true,
            price: parseFloat(editingItem.price as any)
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
            toast.success("Cardápio atualizado!");
            const { data } = await supabase.from('menu_items').select('*').eq('place_id', activeOwnedPlaceId).order('category', { ascending: true });
            if (data) setMenuItems(data);
            setEditingItem(null);
        } else {
            toast.error("Erro ao salvar.");
        }
        setIsSaving(false);
    };

    const deleteItem = async (id: string) => {
        if (!window.confirm("Excluir item?")) return;
        const { error } = await supabase.from('menu_items').delete().eq('id', id);
        if (!error) {
            toast.success("Removido.");
            setMenuItems(prev => prev.filter(item => item.id !== id));
        }
    };

    if (!activeOwnedPlaceId) return <div className="p-10 text-center opacity-50">Selecione um local no topo.</div>;

    return (
        <div className="p-6 space-y-8 bg-white min-h-full pb-24">
            <header className="flex justify-between items-center px-1">
                <div>
                    <h1 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Cardápio Digital</h1>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-1">Gerencie os itens do seu estabelecimento</p>
                </div>
                <button 
                    onClick={handleNewClick}
                    className="bg-primary text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </header>

            {loading ? <LoadingSpinner /> : (
                <div className="space-y-4">
                    {menuItems.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-3xl border border-border-subtle flex items-center shadow-sm">
                            <img src={item.image_url || 'https://picsum.photos/seed/food/100/100'} className="w-16 h-16 rounded-2xl object-cover mr-4 border border-border-subtle" />
                            <div className="flex-grow min-w-0">
                                <h3 className="font-black text-text-primary tracking-tight truncate">{item.name}</h3>
                                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{item.category} &bull; R$ {item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex space-x-1">
                                <button onClick={() => handleEditClick(item)} className="p-2 text-text-secondary hover:text-primary"><Edit size={18} /></button>
                                <button onClick={() => deleteItem(item.id)} className="p-2 text-text-secondary hover:text-red-500"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                    {menuItems.length === 0 && (
                        <div className="text-center py-20 opacity-20 flex flex-col items-center">
                            <Utensils size={48} className="mb-4" />
                            <p className="font-black uppercase tracking-widest text-[10px]">Cardápio vazio</p>
                        </div>
                    )}
                </div>
            )}

            {editingItem && (
                <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-[150] p-4">
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative animate-fade-in-up">
                        <button onClick={() => setEditingItem(null)} className="absolute top-4 right-4 text-text-secondary p-2"><X size={24} /></button>
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-tighter mb-6">{editingItem.id ? 'Editar Item' : 'Novo Item'}</h2>
                        
                        <form onSubmit={handleSaveItem} className="space-y-4">
                            <div className="flex justify-center mb-6">
                                {editingItem.image_url ? (
                                    <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-2 border-primary">
                                        <img src={editingItem.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => setEditingItem({...editingItem, image_url: ''})} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 bg-secondary border-2 border-dashed border-border-subtle rounded-3xl flex flex-col items-center justify-center text-text-secondary cursor-pointer hover:bg-border-subtle transition-colors">
                                        {uploading ? <Loader2 size={24} className="animate-spin" /> : <><UploadCloud size={24} /><p className="text-[10px] font-black uppercase mt-1">Foto</p></>}
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-text-secondary uppercase ml-2 tracking-widest">Nome do Produto</label>
                                <input type="text" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required className="w-full bg-secondary px-5 py-3 rounded-2xl text-sm font-bold border border-transparent outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-text-secondary uppercase ml-2 tracking-widest">Preço (R$)</label>
                                    <input type="number" step="0.01" value={editingItem.price || 0} onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})} required className="w-full bg-secondary px-5 py-3 rounded-2xl text-sm font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-text-secondary uppercase ml-2 tracking-widest">Categoria</label>
                                    <select value={editingItem.category || 'Comida'} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full bg-secondary px-5 py-3 rounded-2xl text-sm font-bold appearance-none">
                                        <option value="Comida">Comida</option>
                                        <option value="Bebida">Bebida</option>
                                        <option value="Sobremesa">Sobremesa</option>
                                        <option value="Dose">Dose</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-text-secondary uppercase ml-2 tracking-widest">Descrição curta</label>
                                <textarea value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full bg-secondary p-5 rounded-2xl text-sm text-text-primary outline-none" rows={2} />
                            </div>
                            <button type="submit" disabled={isSaving || uploading} className="w-full bg-text-primary text-white font-black py-4 rounded-2xl flex items-center justify-center uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all mt-4">
                                {isSaving ? <Loader2 size={20} className="animate-spin" /> : 'Salvar no Cardápio'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuManagementPage;