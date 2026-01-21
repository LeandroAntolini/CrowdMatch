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
            const { data } = await supabase.from('menu_items').select('*').eq('place_id', activeOwnedPlaceId).order('category', { ascending: true });
            if (data) setMenuItems(data);
            setLoading(false);
        };
        fetchMenu();
    }, [activeOwnedPlaceId]);

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || !activeOwnedPlaceId || isSaving) return;
        setIsSaving(true);
        const payload = { ...editingItem, place_id: activeOwnedPlaceId, price: parseFloat(editingItem.price as any) };
        const { error } = editingItem.id ? await supabase.from('menu_items').update(payload).eq('id', editingItem.id) : await supabase.from('menu_items').insert(payload);
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

    if (!activeOwnedPlaceId) return <div className="p-10 text-center opacity-50">Selecione um local no topo.</div>;

    return (
        <div className="p-6 space-y-8 bg-white min-h-full pb-24">
            <header className="flex justify-between items-center px-1">
                <div>
                    <h1 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Cardápio Digital</h1>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-1">Gerencie os itens do seu estabelecimento</p>
                </div>
                <button onClick={() => setEditingItem({ name: '', price: 0, category: 'Comida', is_available: true })} className="bg-text-primary text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform"><Plus size={24} /></button>
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
                                <button onClick={() => setEditingItem(item)} className="p-2 text-text-secondary hover:text-primary"><Edit size={18} /></button>
                                <button onClick={async () => { if(window.confirm("Excluir item?")){ await supabase.from('menu_items').delete().eq('id', item.id); setMenuItems(m => m.filter(i => i.id !== item.id)); toast.success("Removido."); } }} className="p-2 text-text-secondary hover:text-red-500"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editingItem && (
                <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-[150] p-4">
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative animate-fade-in-up shadow-2xl">
                        <button onClick={() => setEditingItem(null)} className="absolute top-4 right-4 text-text-secondary p-2"><X size={24} /></button>
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-tighter mb-6">{editingItem.id ? 'Editar Item' : 'Novo Item'}</h2>
                        <form onSubmit={handleSaveItem} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-text-secondary uppercase ml-2">Nome do Produto</label>
                                <input type="text" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required className="w-full bg-secondary px-5 py-3 rounded-xl text-sm font-bold text-text-primary outline-none border border-transparent" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-text-secondary uppercase ml-2">Preço (R$)</label>
                                    <input type="number" step="0.01" value={editingItem.price || 0} onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})} required className="w-full bg-secondary px-5 py-3 rounded-xl text-sm font-bold text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-text-secondary uppercase ml-2">Categoria</label>
                                    <select value={editingItem.category || 'Comida'} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full bg-secondary px-5 py-3 rounded-xl text-sm font-bold text-text-primary appearance-none border border-transparent">
                                        <option value="Comida" className="text-text-primary">Comida</option>
                                        <option value="Bebida" className="text-text-primary">Bebida</option>
                                        <option value="Sobremesa" className="text-text-primary">Sobremesa</option>
                                        <option value="Dose" className="text-text-primary">Dose</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-text-primary text-white font-black py-4 rounded-2xl flex items-center justify-center uppercase tracking-widest text-xs mt-4">Salvar no Cardápio</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuManagementPage;