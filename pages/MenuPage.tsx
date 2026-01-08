import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { MenuItem, Order } from '../types';
import { Utensils, ShoppingBag, Plus, Minus, ChevronLeft, Loader2, QrCode, Receipt } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import QuickSignUpForm from '../components/QuickSignUpForm';
import MenuQrScannerModal from '../components/MenuQrScannerModal';
import ComandaOverlay from '../components/ComandaOverlay';
import { toast } from 'react-hot-toast';

const MenuPage: React.FC = () => {
    const { placeId, tableNumber } = useParams<{ placeId: string; tableNumber: string }>();
    const navigate = useNavigate();
    const { getPlaceById, isAuthenticated, checkInUser, currentUser, getCurrentCheckIn } = useAppContext();

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [userOrders, setUserOrders] = useState<Order[]>([]);
    const [cart, setCart] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [ordering, setOrdering] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isComandaOpen, setIsComandaOpen] = useState(false);

    const place = useMemo(() => placeId ? getPlaceById(placeId) : null, [placeId, getPlaceById]);
    const isPlaceOpen = place?.isOpen ?? true;

    const isNightlife = place?.category === 'Boate' || place?.category === 'Casa de Shows' || place?.category === 'Espaço Musical';
    const labelSingular = isNightlife ? 'Comanda' : 'Mesa';

    const occupyTable = useCallback(async () => {
        if (!placeId || !tableNumber || !currentUser?.id) return;
        try {
            await supabase.from('tables').upsert({ 
                place_id: placeId,
                table_number: parseInt(tableNumber),
                current_user_id: currentUser.id, 
                last_activity: new Date().toISOString() 
            }, { onConflict: 'place_id,table_number' });
        } catch (e) {
            console.error("Erro ao ocupar mesa:", e);
        }
    }, [placeId, tableNumber, currentUser?.id]);

    const fetchOrders = useCallback(async () => {
        if (!placeId || !currentUser?.id) return;
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, menu_items(*))')
            .eq('place_id', placeId)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        if (!error && data) setUserOrders(data);
    }, [placeId, currentUser?.id]);

    useEffect(() => {
        if (!placeId) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const { data, error: menuError } = await supabase
                    .from('menu_items')
                    .select('*')
                    .eq('place_id', placeId)
                    .eq('is_available', true);
                
                if (menuError) throw menuError;
                setMenuItems(data || []);

                if (isAuthenticated && currentUser) {
                    await fetchOrders();
                    
                    if (tableNumber) {
                        await occupyTable();
                        
                        if (isPlaceOpen) {
                            const currentCi = getCurrentCheckIn();
                            if (currentCi?.placeId !== placeId) {
                                await checkInUser(placeId);
                                toast.success(`Check-in automático: Você está na ${labelSingular} ${tableNumber}!`);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Erro ao carregar cardápio:", err);
                toast.error("Erro ao sincronizar dados do local.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [placeId, tableNumber, isAuthenticated, currentUser, isPlaceOpen, fetchOrders, occupyTable, checkInUser, getCurrentCheckIn, labelSingular]);

    const addToCart = (id: string) => {
        if (!isPlaceOpen) {
            toast.error("O estabelecimento está fechado.");
            return;
        }
        setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    };

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
            toast.error("Erro na identificação da mesa.");
            return;
        }
        setOrdering(true);
        try {
            const { data: orderData, error: orderError } = await supabase.from('orders').insert({ 
                place_id: placeId, 
                user_id: currentUser.id, 
                table_number: parseInt(tableNumber), 
                total_price: cartTotal, 
                status: 'pending' 
            }).select().single();
            
            if (orderError) throw orderError;

            const itemsToInsert = Object.entries(cart).map(([itemId, qty]) => ({ 
                order_id: orderData.id, 
                menu_item_id: itemId, 
                quantity: qty, 
                unit_price: menuItems.find(i => i.id === itemId)?.price || 0 
            }));
            
            await supabase.from('order_items').insert(itemsToInsert);
            toast.success("Pedido enviado para a cozinha!");
            setCart({});
            await fetchOrders();
        } catch (error: any) {
            toast.error("Erro ao enviar: " + error.message);
        } finally {
            setOrdering(false);
        }
    };

    // Renderização das categorias movida para fora do return principal (JSX)
    const renderedMenu = useMemo(() => {
        const categories = Array.from(new Set(menuItems.map(i => i.category)));
        if (menuItems.length === 0) return (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <Utensils size={48} className="mb-4" />
                <p className="font-bold">Nenhum item disponível.</p>
            </div>
        );
        
        return categories.map(cat => (
            <section key={cat} className="animate-fade-in-up mt-6 first:mt-0">
                <h2 className="text-sm font-black text-primary mb-4 border-l-4 border-primary pl-3 uppercase tracking-tighter">{cat}</h2>
                <div className="space-y-4">
                    {menuItems.filter(i => i.category === cat).map(item => (
                        <div key={item.id} className="bg-surface rounded-2xl p-3 flex items-center shadow-xl border border-gray-800/50">
                            <div className="relative flex-shrink-0">
                                <img src={item.image_url || 'https://picsum.photos/seed/food/100/100'} className="w-20 h-20 rounded-xl object-cover" alt={item.name} />
                                {!item.is_available && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                                        <span className="text-[8px] font-black text-white uppercase">Esgotado</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow ml-4 min-w-0">
                                <h3 className="font-bold text-text-primary text-sm truncate">{item.name}</h3>
                                <p className="text-[10px] text-text-secondary mb-2 line-clamp-2 leading-relaxed">{item.description}</p>
                                <div className="flex justify-between items-center">
                                    <span className="font-black text-accent text-base">R$ {item.price.toFixed(2)}</span>
                                    {tableNumber && (
                                        <div className={`flex items-center bg-gray-900 rounded-full p-1 border border-gray-800 ${(!isPlaceOpen || !item.is_available) ? 'opacity-30 pointer-events-none' : ''}`}>
                                            {cart[item.id] ? (
                                                <div className="flex items-center">
                                                    <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-accent hover:bg-gray-800 rounded-full transition-colors"><Minus size={16} /></button>
                                                    <span className="px-3 font-black text-sm text-text-primary">{cart[item.id]}</span>
                                                </div>
                                            ) : null}
                                            <button onClick={() => addToCart(item.id)} className="p-1.5 text-accent hover:bg-gray-800 rounded-full transition-colors"><Plus size={16} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        ));
    }, [menuItems, cart, tableNumber, isPlaceOpen]);

    if (loading) return (
        <div className="h-screen w-screen bg-background flex items-center justify-center">
            <LoadingSpinner message="Abrindo cardápio..." />
        </div>
    );
    
    if (!placeId) return <div className="h-screen bg-background p-10 text-center flex flex-col items-center justify-center">Local não identificado. <button onClick={() => navigate('/')} className="mt-4 text-accent">Voltar</button></div>;

    if (!isAuthenticated && tableNumber) return (
        <div className="h-screen bg-background p-6 flex flex-col items-center justify-center">
            <div className="text-center mb-8">
                <QrCode size={64} className="text-accent mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Bem-vindo ao {place?.name || 'Local'}</h1>
                <p className="text-text-secondary text-sm">Identificamos que você está na <strong>{labelSingular} {tableNumber}</strong>.</p>
            </div>
            <QuickSignUpForm onSuccess={() => isPlaceOpen && checkInUser(placeId!)} />
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            <header className="flex-shrink-0 p-4 bg-surface border-b border-gray-800 sticky top-0 z-50 flex justify-between items-center shadow-lg">
                <div className="flex items-center overflow-hidden">
                    <button onClick={() => navigate(-1)} className="mr-3 p-2 hover:bg-gray-800 rounded-full text-text-secondary"><ChevronLeft size={24} /></button>
                    <div className="overflow-hidden">
                        <h1 className="text-lg font-black truncate max-w-[140px] leading-tight">{place?.name || 'Cardápio'}</h1>
                        <p className="text-[10px] text-accent font-black uppercase tracking-widest">
                            {tableNumber ? `${labelSingular} ${tableNumber}` : 'Cardápio Digital'}
                            {!isPlaceOpen && " • FECHADO"}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsComandaOpen(true)} 
                    className="p-3 bg-gray-800 rounded-xl text-text-primary relative hover:bg-gray-700 transition-colors"
                    aria-label="Ver Comanda"
                >
                    <Receipt size={22} />
                    {userOrders.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-[10px] font-black flex items-center justify-center rounded-full border-2 border-surface">
                            {userOrders.length}
                        </span>
                    )}
                </button>
            </header>

            <div className="flex-grow overflow-y-auto p-4 pb-48">
                {!isPlaceOpen && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-sm flex items-center shadow-sm mb-4">
                        <Utensils size={20} className="mr-3 flex-shrink-0" />
                        <p className="font-medium">O local está fechado. Você pode ver os itens, mas pedidos estão desabilitados.</p>
                    </div>
                )}

                {renderedMenu}
            </div>

            {cartTotal > 0 && isPlaceOpen && (
                <div className="fixed bottom-6 left-4 right-4 bg-accent p-4 rounded-3xl shadow-[0_-10px_40px_rgba(236,72,153,0.4)] z-[60] animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <div className="flex flex-col">
                            <span className="font-black uppercase text-[10px] tracking-widest opacity-70 text-white">Carrinho</span>
                            <span className="text-2xl font-black text-white">R$ {cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="bg-white/20 px-3 py-1 rounded-lg text-white text-xs font-black">
                            {Object.values(cart).reduce((a, b) => a + b, 0)} ITENS
                        </div>
                    </div>
                    <button 
                        onClick={handlePlaceOrder} 
                        disabled={ordering} 
                        className="w-full bg-white text-accent font-black py-4 rounded-2xl flex items-center justify-center hover:scale-[0.98] transition-transform active:scale-95 shadow-lg"
                    >
                        {ordering ? <Loader2 className="animate-spin mr-2" /> : <ShoppingBag className="mr-2" size={20} />} 
                        CONFIRMAR PEDIDO • {labelSingular.toUpperCase()} {tableNumber}
                    </button>
                </div>
            )}

            <ComandaOverlay isOpen={isComandaOpen} onClose={() => setIsComandaOpen(false)} orders={userOrders} />
            <MenuQrScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
                onScan={num => navigate(`/menu/${placeId}/${num}`)} 
                expectedPlaceId={placeId} 
            />
        </div>
    );
};

export default MenuPage;