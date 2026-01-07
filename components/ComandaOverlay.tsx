import React from 'react';
import { X, Receipt, CheckCircle2, Clock } from 'lucide-react';
import { Order } from '../types';

interface ComandaOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    orders: Order[];
}

const ComandaOverlay: React.FC<ComandaOverlayProps> = ({ isOpen, onClose, orders }) => {
    if (!isOpen) return null;

    const totalAccumulated = orders.reduce((sum, order) => sum + order.total_price, 0);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock size={16} className="text-yellow-500" />;
            case 'preparing': return <Clock size={16} className="text-blue-500" />;
            case 'delivered': return <CheckCircle2 size={16} className="text-green-500" />;
            default: return <Receipt size={16} className="text-gray-400" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendente';
            case 'preparing': return 'Preparando';
            case 'delivered': return 'Entregue';
            case 'paid': return 'Pago';
            default: return status;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[110] flex flex-col animate-fade-in-up">
            <div className="mt-auto bg-surface w-full max-w-md mx-auto rounded-t-3xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <div className="flex items-center">
                        <Receipt className="text-accent mr-2" />
                        <h2 className="text-xl font-bold">Minha Comanda</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    {orders.length === 0 ? (
                        <div className="text-center py-10">
                            <Receipt size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-text-secondary">Você ainda não fez nenhum pedido.</p>
                        </div>
                    ) : (
                        orders.map((order, idx) => (
                            <div key={order.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Pedido #{orders.length - idx}</span>
                                    <div className="flex items-center text-xs font-bold px-2 py-1 rounded-full bg-surface">
                                        {getStatusIcon(order.status)}
                                        <span className="ml-1 uppercase">{getStatusText(order.status)}</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    {order.order_items?.map(item => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-text-secondary">{item.quantity}x {item.menu_item?.name}</span>
                                            <span className="font-medium">R$ {(item.quantity * item.unit_price).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between font-bold">
                                    <span>Subtotal</span>
                                    <span className="text-accent">R$ {order.total_price.toFixed(2)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-gray-900/50 border-t border-gray-700 rounded-t-3xl">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-lg font-bold">Total da Conta</span>
                        <span className="text-2xl font-black text-primary">R$ {totalAccumulated.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-full bg-surface text-text-primary font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        Continuar Pedindo
                    </button>
                    <p className="text-[10px] text-center text-text-secondary mt-4 uppercase tracking-widest">
                        Apresente seu QR Code no caixa para pagar
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ComandaOverlay;