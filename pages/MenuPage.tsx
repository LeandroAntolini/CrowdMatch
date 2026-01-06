import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { MenuItem, OrderItem } from '../types';
import { Utensils, ShoppingBag, Plus, Minus, ChevronLeft, Loader2, QrCode } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import QuickSignUpForm from '../components/QuickSignUpForm';

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
    const [cart, setCart] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [ordering, setOrdering] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const place = placeId ? getPlaceById(placeId) : null;
    const isCheckedIn = getCurrentCheckIn()?.placeId === placeId;

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

        // Se o usuário chegar via QR Code e estiver logado, faz check-in automático
        if (isAuthenticated && tableNumber && !isCheckedIn) {
            checkInUser(placeId);
        }
    }, [placeId, tableNumber, isAuthenticated, isCheckedIn, checkInUser]);

    const categories = useMemo(() => {
        const cats = new Set(menuItems.map(item => item.category));
        return Array.from(cats);
    }, [menuItems]);

    const addToCart = (id: string) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    const removeFromCart = (id: string) => setCart(prev => {
        const newCart = { ...prev };
        if (newCart[id] > 1) newCart[id]--;
        else delete newCart[id];
        return newCart;
    });

    const cartTotal = useMemo(() => {
        return Object.entries(cart).reduce((total, [id, qty]) => {
            const item = menuItems.find(i => i.id === id);
            return total + (item?.price || 0) * qty;
        }, 0);
    }, [cart, menuItems]);

    const handlePlaceOrder = async () => {
        if (!isAuthenticated || !tableNumber || !placeId) return;
        setOrdering(true);

        try {
            // 1. Criar o pedido
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    place_id: placeId,
                    user_id: currentUser?.id,
                    table_number: parseInt(tableNumber),
                    total_price: cartTotal,
                    status: 'pending'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Criar os itens do pedido
            const orderItems = Object.entries(cart).map(([id, qty]) => {
                const item = menuItems.find(i => i.id === id);
                return {
                    order_id: order.id,
                    menu_item_id: id,
                    quantity: qty,
                    unit_price: item?.price || 0
                };
            });

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            setOrderSuccess(true);
            setCart({});
        } catch (error: any) {
            alert("Erro ao realizar pedido: " + error.message);
        } finally {
            setOrdering(false);
        }
    };

    if (loading) return <LoadingSpinner message="Carregando cardápio..." />;

    if (!isAuthenticated && tableNumber) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-full">
                <QrCode size={64} className="text-accent mb-4" />
                <QuickSignUpForm onSuccess={() => checkInUser(placeId!)} />
            </div>
        );
    }

    if (orderSuccess) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-full">
                <ShoppingBag size={80} className="text-green-400 mb-6" />
                <h2 className="text-3xl font-bold mb-2">Pedido Enviado!</h2>
                <p className="text-text-secondary mb-8">
                    Seu pedido para a mesa {tableNumber} foi recebido. Em breve o garçom trará seus itens.
                </p>
                <button 
                    onClick={() => setOrderSuccess(false)}
                    className="bg-accent text-white font-bold py-3 px-8 rounded-lg"
                >
                    Fazer novo pedido
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background relative">
            <header className="p-4 bg-surface border-b border-gray-700 sticky top-0 z-10">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="mr-4 text-text-secondary">
                        <ChevronLeft size={28} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold truncate">{place?.name}</h1>
                        <p className="text-xs text-accent">
                            {tableNumber ? `Mesa ${tableNumber} • Comanda Aberta` : 'Visualizando Cardápio'}
                        </p>
                    </div>
                </div>
            </header>

            <div className="flex-grow overflow-y-auto p-4 space-y-8 pb-32">
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
                                            
                                            {tableNumber ? (
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

            {cartTotal > 0 && tableNumber && (
                <div className="fixed bottom-20 left-4 right-4 bg-accent p-4 rounded-xl shadow-2xl animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <ShoppingBag className="mr-2" />
                            <span className="font-bold">Seu Pedido</span>
                        </div>
                        <span className="text-xl font-bold">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={handlePlaceOrder}
                        disabled={ordering}
                        className="w-full bg-white text-accent font-bold py-3 rounded-lg flex items-center justify-center"
                    >
                        {ordering ? <Loader2 className="animate-spin mr-2" /> : null}
                        Confirmar Pedido na Mesa {tableNumber}
                    </button>
                </div>
            )}
            
            {!tableNumber && (
                <div className="fixed bottom-20 left-4 right-4 bg-surface p-4 rounded-xl border border-accent/30 text-center">
                    <p className="text-sm text-text-secondary">
                        Escaneie o QR Code da mesa para fazer pedidos.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MenuPage;