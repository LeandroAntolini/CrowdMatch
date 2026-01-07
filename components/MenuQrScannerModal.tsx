import React from 'react';
import { QrReader } from 'react-qr-reader';
import { X, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
            
            // O formato esperado é .../#/menu/:placeId/:tableNumber
            // Vamos tentar extrair os parâmetros
            const parts = text.split('/');
            const tableNum = parts[parts.length - 1];
            const scannedPlaceId = parts[parts.length - 2];

            if (scannedPlaceId && tableNum && !isNaN(Number(tableNum))) {
                // Se estivermos esperando um local específico (dentro do menu)
                if (expectedPlaceId) {
                    if (scannedPlaceId === expectedPlaceId) {
                        onScan?.(tableNum);
                        onClose();
                    } else {
                        alert("Este QR Code pertence a outro estabelecimento.");
                    }
                } else {
                    // Uso global (Header): Redireciona para o menu escaneado
                    onClose();
                    navigate(`/menu/${scannedPlaceId}/${tableNum}`);
                }
            } else {
                alert("QR Code inválido. Certifique-se de que é um QR Code de mesa do CrowdMatch.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[150] p-6">
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full"
            >
                <X size={32} />
            </button>

            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Escanear Mesa</h2>
                <p className="text-gray-400">Aponte para o QR Code na mesa do estabelecimento</p>
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