import React from 'react';
import { QrReader } from 'react-qr-reader';
import { X, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface MenuQrScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan?: (tableNumber: string) => void;
    expectedPlaceId?: string;
}

const MenuQrScannerModal: React.FC<MenuQrScannerModalProps> = ({ isOpen, onClose, onScan, expectedPlaceId }) => {
    const navigate = useNavigate();
    
    if (!isOpen) return null;

    const handleResult = (result: any) => {
        if (result) {
            const text = result.getText();
            console.log("QR Code detectado:", text);
            
            // Regex flexível para capturar /menu/PLACE_ID/TABLE_NUMBER
            // Ignora o que vem antes (domínio, protocolo, hash)
            const menuPattern = /\/menu\/([^\/]+)\/(\d+)/;
            const match = text.match(menuPattern);

            if (match) {
                const scannedPlaceId = match[1];
                const tableNum = match[2];

                toast.success("Mesa identificada! Abrindo cardápio...");

                if (expectedPlaceId && scannedPlaceId !== expectedPlaceId) {
                    toast.error("Este QR Code pertence a outro estabelecimento.");
                    return;
                }

                if (onScan) {
                    onScan(tableNum);
                } else {
                    // Navegação direta
                    navigate(`/menu/${scannedPlaceId}/${tableNum}`);
                }
                onClose();
            } else {
                toast.error("QR Code inválido para mesas.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[200] p-6">
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
                <X size={32} />
            </button>

            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Escanear Mesa</h2>
                <p className="text-gray-400">Aponte para o QR Code na mesa</p>
            </div>

            <div className="w-full max-w-sm aspect-square bg-gray-900 rounded-3xl overflow-hidden relative border-2 border-accent/50 shadow-[0_0_50px_rgba(236,72,153,0.3)]">
                <QrReader
                    onResult={handleResult}
                    constraints={{ facingMode: 'environment' }}
                    className="w-full h-full"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-2 border-accent/30 rounded-2xl animate-pulse flex items-center justify-center">
                        <ScanLine size={48} className="text-accent" />
                    </div>
                </div>
            </div>

            <button 
                onClick={onClose}
                className="mt-12 text-gray-400 font-medium hover:text-white transition-colors py-2 px-8"
            >
                Cancelar
            </button>
        </div>
    );
};

export default MenuQrScannerModal;