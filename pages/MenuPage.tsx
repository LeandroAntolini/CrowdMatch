import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { MenuItem, Order } from '../types';
import { Utensils, ShoppingBag, Plus, Minus, ChevronLeft, Loader2, QrCode, AlertCircle, CheckCircle, Receipt } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import QuickSignUpForm from '../components/QuickSignUpForm';
import MenuQrScannerModal from '../components/MenuQrScannerModal';
import ComandaOverlay from '../components/ComandaOverlay';
import { toast } from 'react-hot-toast';

const MenuPage: React.FC = () => {
    const { placeId, tableNumber } = useParams<{ placeId: string; tableNumber: string }>();
    const navigate = useNavigate();
    const { getPlaceById, isAuthenticated, checkInUser, currentUser } = useAppContext();

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [userOrders, setUserOrders] = useState<Order[]>([]);
    const [cart, setCart] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [ordering, setOrdering] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isComandaOpen, setIsComandaOpen] = useState(false);

    const place = placeId ? getPlaceById(placeId) : null;
    const isPlaceOpen = place?.isOpen ?? true;

    const fetchOrders = useCallback(async () => {
        if (!placeId || !currentUser?.id) return;
        
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, menu_items(*))')
            .eq('place_id', placeId)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setUserOrders(data);
        }
    }, [placeId, currentUser?.id]);

    useEffect(() => {
        if (!placeId) return;

        const loadData = async () => {
            const { data } = await supabase.from('menu_items').select('*').eq('place_id', placeId).eq('is_available', true);
            setMenuItems(data || []);
            if (isAuthenticated) await fetchOrders();
            setLoading(false);
        };
        loadData();

        if (isAuthenticated && currentUser?.id) {
            const channel = supabase.channel(`comanda-${placeId}`)
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'orders',
                    filter: `user_id=eq.${currentUser.id}`
                }, () => fetchOrders())
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [placeId, isAuthenticated, currentUser?.id, fetchOrders]);

    const addToCart = (id: string) => isPlaceOpen && setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    const removeFromCart = (id: string) => setCart(prev => {
        const next = { ...prev };
        if (next[id] > 1) next[id]--; else delete next[id];
        return next;
    });

    const cartTotal = useMemo(() => Object.entries(cart).reduce((total, [id, qty]) => {
        const item = menuItems.find(i => i.id === id);
        return total + (item?.price || 0) * qty;
    }, 0), [cart, menuItems]);

    const handlePlaceOrder = async () => {
        if (!currentUser?.id || !tableNumber || !placeId) {
            toast.error("Erro de autenticação.");
            return;
        }
        
        setOrdering(true);
        try {
            // 1. Inserir o pedido e obter o objeto criado (para pegar o ID gerado pelo banco)
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    place_id: placeId,
                    user_id: currentUser.id,
                    table_number: parseInt(tableNumber),
                    total_price: cartTotal,
                    status: 'pending'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Inserir os itens usando o ID do pedido retornado
            const itemsToInsert = Object.entries(cart).map(([itemId, qty]) => ({
                order_id: orderData.id,
                menu_item_id: itemId,
                quantity: qty,
                unit_price: menuItems.find(i => i.id === itemId)?.price || 0
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;

            toast.success("Pedido enviado para a cozinha!");
            setCart({});
            await fetchOrders();
        } catch (error: any) {
            console.error("Erro ao processar pedido:", error);
            toast.error("Falha no envio: " + error.message);
        } finally {
            setOrdering(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    
    if (!isAuthenticated && tableNumber) return (
        <div className="p-6 flex flex-col items-center justify-center min-h-full">
            <QrCode size={64} className="text-accent mb-4" />
            <QuickSignUpForm onSuccess={() => isPlaceOpen && checkInUser(placeId!)} />
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-background">
            <header className="p-4 bg-surface border-b border-gray-700 sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="mr-4 text-text-secondary"><ChevronLeft size={28} /></button>
                    <div>
                        <h1 className="text-xl font-bold truncate max-w-[150px]">{place?.name}</h1>
                        <p className="text-xs text-accent font-bold">{tableNumber ? `MESA ${tableNumber}` : 'Cardápio Digital'}</p>
                    </div>
                </div>
                <button onClick={() => setIsComandaOpen(true)} className="p-2 text-text-secondary relative">
                    <Receipt size={24} />
                    {userOrders.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-surface"></span>}
                </button>
            </header>

            <div className="flex-grow overflow-y-auto p-4 space-y-8 pb-40">
                {useMemo(() => {
                    const cats = Array.from(new Set(menuItems.map(i => i.category)));
                    return cats.map(cat => (
                        <section key={cat}>
                            <h2 className="text-lg font-bold text-primary mb-4 border-l-4 border-primary pl-3 uppercase tracking-wider">{cat}</h2>
                            <div className="space-y-4">
                                {menuItems.filter(i => i.category === cat).map(item => (
                                    <div key={item.id} className="bg-surface rounded-2xl p-3 flex items-center shadow-lg border border-gray-800">
                                        <img src={item.image_url || 'https://picsum.photos/seed/food/100/100'} className="w-20 h-20 rounded-xl object-cover mr-4" />
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-text-primary">{item.name}</h3>
                                            <p className="text-[10px] text-text-secondary mb-2 line-clamp-2">{item.description}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="font-black text-accent">R$ {item.price.toFixed(2)}</span>
                                                {tableNumber && isPlaceOpen && (
                                                    <div className="flex items-center bg-gray-800 rounded-full p-1 border border-gray-700">
                                                        {cart[item.id] ? (
                                                            <><button onClick={() => removeFromCart(item.id)} className="p-1.5 text-accent hover:bg-gray-700 rounded-full transition-colors"><Minus size={16} /></button>
                                                            <span className="px-3 font-bold text-sm">{cart[item.id]}</span></>
                                                        ) : null}
                                                        <button onClick={() => addToCart(item.id)} className="p-1.5 text-accent hover:bg-gray-700 rounded-full transition-colors"><Plus size={16} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ));
                }, [menuItems, cart, tableNumber, isPlaceOpen])}
            </div>

            {cartTotal > 0 && (
                <div className="fixed bottom-24 left-4 right-4 bg-accent p-4 rounded-2xl shadow-2xl z-20 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-3">
                        <span className="font-bold uppercase text-xs opacity-80 text-white">Seu Carrinho</span>
                        <span className="text-2xl font-black text-white">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={handlePlaceOrder} 
                        disabled={ordering} 
                        className="w-full bg-white text-accent font-black py-4 rounded-xl flex items-center justify-center shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        {ordering ? <Loader2 className="animate-spin mr-2" /> : <ShoppingBag className="mr-2" />} 
                        ENVIAR PEDIDO NA MESA {tableNumber}
                    </button>
                </div>
            )}

            <ComandaOverlay isOpen={isComandaOpen} onClose={() => setIsComandaOpen(false)} orders={userOrders} />
            <MenuQrScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={num => navigate(`/menu/${placeId}/${num}`)} expectedPlaceId={placeId} />
        </div>
    );
};

export default MenuPage;