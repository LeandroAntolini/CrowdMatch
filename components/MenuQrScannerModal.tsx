import React from 'react';
import { QrReader } from 'react-qr-reader';
import { X, ScanLine } from 'lucide-react';

interface MenuQrScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (tableNumber: string) => void;
    expectedPlaceId: string;
}

const MenuQrScannerModal: React.FC<MenuQrScannerModalProps> = ({ isOpen, onClose, onScan, expectedPlaceId }) => {
    if (!isOpen) return null;

    const handleResult = (result: any) => {
        if (result) {
            const text = result.getText();
            // O formato esperado é .../#/menu/:placeId/:tableNumber
            // Vamos extrair a última parte da URL
            const parts = text.split('/');
            const tableNum = parts[parts.length - 1];
            const scannnedPlaceId = parts[parts.length - 2];

            if (scannnedPlaceId === expectedPlaceId && tableNum && !isNaN(Number(tableNum))) {
                onScan(tableNum);
                onClose();
            } else {
                alert("QR Code inválido para este estabelecimento.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[100] p-6">
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full"
            >
                <X size={32} />
            </button>

            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Identificar Mesa</h2>
                <p className="text-gray-400">Aponte a câmera para o QR Code na sua mesa</p>
            </div>

            <div className="w-full max-w-sm aspect-square bg-gray-800 rounded-2xl overflow-hidden relative border-2 border-accent/50">
                <QrReader
                    onResult={handleResult}
                    constraints={{ facingMode: 'environment' }}
                    className="w-full h-full"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-2 border-accent rounded-2xl animate-pulse flex items-center justify-center">
                        <ScanLine size={48} className="text-accent/50" />
                    </div>
                </div>
            </div>

            <button 
                onClick={onClose}
                className="mt-12 text-gray-400 font-medium hover:text-white transition-colors"
            >
                Cancelar
            </button>
        </div>
    );
};

export default MenuQrScannerModal;