import React, { useState, useEffect, useMemo } from 'react';
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
    const { 
        getPlaceById, 
        isAuthenticated, 
        checkInUser, 
        getCurrentCheckIn,
        currentUser
    } = useAppContext();

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [userOrders, setUserOrders] = useState<Order[]>([]);
    const [cart, setCart] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [ordering, setOrdering] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isComandaOpen, setIsComandaOpen] = useState(false);

    const place = placeId ? getPlaceById(placeId) : null;
    const isCheckedIn = getCurrentCheckIn()?.placeId === placeId;
    const isPlaceOpen = place?.isOpen ?? true;

    const fetchOrders = async () => {
        // Busca o ID do usuário diretamente da sessão para evitar delays do Context
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || currentUser?.id;

        if (!placeId || !userId) return;
        
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*, menu_items(*))')
                .eq('place_id', placeId)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            if (data) setUserOrders(data);
        } catch (e) {
            console.error("Erro ao buscar comanda:", e);
        }
    };

    useEffect(() => {
        if (!placeId) return;

        const fetchMenu = async () => {
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .eq('place_id', placeId)
                .eq('is_available', true);
            
            if (data) setMenuItems(data);
            setLoading(false);
        };

        fetchMenu();
        
        if (isAuthenticated) {
            fetchOrders();

            // Inscrição em tempo real para atualizações na comanda (status de pedidos)
            const channel = supabase.channel(`user-orders-${placeId}`)
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'orders',
                    filter: `user_id=eq.${currentUser?.id}`
                }, () => fetchOrders())
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }

        if (isAuthenticated && tableNumber && !isCheckedIn && isPlaceOpen) {
            checkInUser(placeId);
        }
    }, [placeId, tableNumber, isAuthenticated, isCheckedIn, checkInUser, isPlaceOpen, currentUser?.id]);

    const categories = useMemo(() => {
        const cats = new Set(menuItems.map(item => item.category));
        return Array.from(cats);
    }, [menuItems]);

    const addToCart = (id: string) => {
        if (!isPlaceOpen) return;
        setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[id] > 1) newCart[id]--;
            else delete newCart[id];
            return newCart;
        });
    };

    const cartTotal = useMemo(() => {
        return Object.entries(cart).reduce((total, [id, qty]) => {
            const item = menuItems.find(i => i.id === id);
            return total + (item?.price || 0) * qty;
        }, 0);
    }, [cart, menuItems]);

    const handlePlaceOrder = async () => {
        // Garantia extra de ID de usuário
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        if (!userId || !tableNumber || !placeId || !isPlaceOpen) {
            toast.error("Erro de identificação. Tente recarregar a página.");
            return;
        }
        
        if (Object.keys(cart).length === 0) return;

        setOrdering(true);
        const orderId = crypto.randomUUID();

        try {
            // 1. Criar o cabeçalho do pedido
            const { error: orderError } = await supabase
                .from('orders')
                .insert({
                    id: orderId,
                    place_id: placeId,
                    user_id: userId,
                    table_number: parseInt(tableNumber),
                    total_price: cartTotal,
                    status: 'pending'
                });

            if (orderError) throw orderError;

            // 2. Criar os itens do pedido
            const orderItems = Object.entries(cart).map(([id, qty]) => {
                const item = menuItems.find(i => i.id === id);
                return {
                    order_id: orderId,
                    menu_item_id: id,
                    quantity: qty,
                    unit_price: item?.price || 0
                };
            });

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            
            if (itemsError) {
                // Se falhou ao inserir itens, tentamos remover o cabeçalho órfão (limpeza básica)
                await supabase.from('orders').delete().eq('id', orderId);
                throw itemsError;
            }

            toast.success("Pedido enviado com sucesso!", { icon: '🚀' });
            setCart({});
            await fetchOrders(); // Atualiza a comanda imediatamente
        } catch (error: any) {
            console.error("Erro no pedido:", error);
            toast.error("Erro ao processar: " + (error.message || "Conexão instável."));
        } finally {
            setOrdering(false);
        }
    };

    const handleScanSuccess = (scannedTableNumber: string) => {
        navigate(`/menu/${placeId}/${scannedTableNumber}`, { replace: true });
    };

    if (loading) return <LoadingSpinner message="Carregando cardápio..." />;

    if (!isAuthenticated && tableNumber) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-full">
                <QrCode size={64} className="text-accent mb-4" />
                <QuickSignUpForm onSuccess={() => isPlaceOpen && checkInUser(placeId!)} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background relative">
            <header className="p-4 bg-surface border-b border-gray-700 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={() => navigate(-1)} className="mr-4 text-text-secondary">
                            <ChevronLeft size={28} />
                        </button>
                        <div className="max-w-[150px]">
                            <h1 className="text-xl font-bold truncate">{place?.name}</h1>
                            <p className="text-xs text-accent font-semibold uppercase tracking-wider">
                                {tableNumber ? `Mesa ${tableNumber}` : 'Cardápio'}
                            </p>
                        </div>
                    </div>
                    {isAuthenticated && (
                        <button 
                            onClick={() => setIsComandaOpen(true)}
                            className="flex flex-col items-center text-text-secondary hover:text-primary transition-colors"
                        >
                            <Receipt size={24} />
                            <span className="text-[10px] font-bold uppercase mt-1">Comanda</span>
                        </button>
                    )}
                </div>
            </header>

            {!isPlaceOpen && (
                <div className="bg-red-500/20 text-red-400 p-3 flex items-center justify-center text-sm font-semibold border-b border-red-500/30">
                    <AlertCircle size={18} className="mr-2" />
                    Estabelecimento fechado no momento.
                </div>
            )}

            <div className="flex-grow overflow-y-auto p-4 space-y-8 pb-32">
                {tableNumber && (
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${isCheckedIn ? 'bg-green-500/10 border-green-500/30' : 'bg-surface border-gray-700'}`}>
                        <div>
                            <div className="flex items-center text-sm font-bold text-text-primary mb-1">
                                <QrCode size={16} className="mr-2 text-accent" />
                                MESA {tableNumber}
                            </div>
                            <p className="text-xs text-text-secondary">
                                {isCheckedIn ? 'Check-in ativo' : 'Identifique-se para pedir'}
                            </p>
                        </div>
                        {isCheckedIn && (
                            <div className="flex flex-col items-center text-green-400">
                                <CheckCircle size={20} />
                                <span className="text-[10px] font-bold mt-1">CONECTADO</span>
                            </div>
                        )}
                    </div>
                )}

                {categories.map(category => (
                    <section key={category}>
                        <h2 className="text-lg font-bold text-primary mb-4 border-l-4 border-primary pl-3">
                            {category}
                        </h2>
                        <div className="space-y-4">
                            {menuItems.filter(item => item.category === category).map(item => (
                                <div key={item.id} className="bg-surface rounded-xl p-3 flex items-center shadow-md">
                                    <img src={item.image_url || 'https://picsum.photos/seed/food/100/100'} alt={item.name} className="w-20 h-20 rounded-lg object-cover mr-4" />
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-text-primary">{item.name}</h3>
                                        <p className="text-xs text-text-secondary line-clamp-2 mb-2">{item.description}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-accent">R$ {item.price.toFixed(2)}</span>
                                            
                                            {tableNumber && isPlaceOpen ? (
                                                <div className="flex items-center bg-gray-800 rounded-full px-2">
                                                    {cart[item.id] ? (
                                                        <>
                                                            <button onClick={() => removeFromCart(item.id)} className="p-1 text-accent">
                                                                <Minus size={18} />
                                                            </button>
                                                            <span className="px-3 font-bold">{cart[item.id]}</span>
                                                        </>
                                                    ) : null}
                                                    <button onClick={() => addToCart(item.id)} className="p-1 text-accent">
                                                        <Plus size={18} />
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {cartTotal > 0 && tableNumber && isPlaceOpen && (
                <div className="fixed bottom-20 left-4 right-4 bg-accent p-4 rounded-xl shadow-2xl animate-fade-in-up z-20">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <ShoppingBag className="mr-2" />
                            <span className="font-bold">Seu Carrinho</span>
                        </div>
                        <span className="text-xl font-bold">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={handlePlaceOrder}
                        disabled={ordering}
                        className="w-full bg-white text-accent font-bold py-3 rounded-lg flex items-center justify-center"
                    >
                        {ordering ? <Loader2 className="animate-spin mr-2" /> : null}
                        Fazer Pedido na Mesa {tableNumber}
                    </button>
                </div>
            )}
            
            {!tableNumber && (
                <div className="fixed bottom-20 left-4 right-4 bg-surface p-4 rounded-xl border border-accent/30 flex items-center justify-between shadow-2xl z-20">
                    <p className="text-sm text-text-secondary text-left flex-grow mr-4">
                        Escaneie a mesa para pedir.
                    </p>
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="bg-accent text-white p-3 rounded-lg shadow-lg flex items-center justify-center shrink-0"
                    >
                        <QrCode size={24} />
                    </button>
                </div>
            )}

            <MenuQrScannerModal 
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScanSuccess}
                expectedPlaceId={placeId || ''}
            />

            <ComandaOverlay 
                isOpen={isComandaOpen}
                onClose={() => setIsComandaOpen(false)}
                orders={userOrders}
            />
        </div>
    );
};

export default MenuPage;