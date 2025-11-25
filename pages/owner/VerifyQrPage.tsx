import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { useAppContext } from '../../context/AppContext';
import { Loader2, CheckCircle, XCircle, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VerificationResult {
    status: 'success' | 'error';
    message: string;
    data?: {
        type: string;
        user: string;
        title?: string;
        placeId: string;
    };
}

const VerifyQrPage: React.FC = () => {
    const { verifyQrCode, ownedPlaceIds } = useAppContext();
    const navigate = useNavigate();
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scannedData, setScannedData] = useState<string | null>(null);

    useEffect(() => {
        if (scannedData) {
            setIsLoading(true);
            setError(null);
            setResult(null);

            const handleVerification = async () => {
                try {
                    const verificationResult = await verifyQrCode(scannedData);
                    
                    // Validação de segurança: o lojista pode validar este QR Code?
                    if (verificationResult.data?.placeId && !ownedPlaceIds.includes(verificationResult.data.placeId)) {
                        setResult({
                            status: 'error',
                            message: 'QR Code inválido para o seu estabelecimento.'
                        });
                    } else {
                        setResult(verificationResult);
                    }

                } catch (e: any) {
                    setError(e.message || 'Ocorreu um erro desconhecido.');
                } finally {
                    setIsLoading(false);
                }
            };

            handleVerification();
        }
    }, [scannedData, verifyQrCode, ownedPlaceIds]);

    const resetScanner = () => {
        setScannedData(null);
        setResult(null);
        setError(null);
        setIsLoading(false);
    };

    return (
        <div className="p-6 flex flex-col items-center h-full">
            <h1 className="text-3xl font-bold mb-4">Verificar QR Code</h1>
            
            {!scannedData && (
                <div className="w-full max-w-sm aspect-square bg-surface rounded-lg overflow-hidden relative">
                    <QrReader
                        onResult={(result, error) => {
                            if (!!result) {
                                setScannedData(result?.getText());
                            }
                            if (!!error) {
                                console.info(error);
                            }
                        }}
                        constraints={{ facingMode: 'environment' }}
                        className="w-full h-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <ScanLine size={128} className="text-white/50 animate-pulse" />
                    </div>
                </div>
            )}

            <div className="mt-6 text-center w-full max-w-sm">
                {isLoading && <Loader2 size={48} className="mx-auto animate-spin text-primary" />}
                
                {error && (
                    <div className="bg-red-500/20 text-red-400 p-4 rounded-lg">
                        <p className="font-bold">Erro na Verificação</p>
                        <p>{error}</p>
                    </div>
                )}

                {result && (
                    <div className={`p-4 rounded-lg ${result.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {result.status === 'success' ? <CheckCircle size={48} className="mx-auto mb-2" /> : <XCircle size={48} className="mx-auto mb-2" />}
                        <p className="font-bold text-lg">{result.message}</p>
                        {result.data && (
                            <div className="text-sm mt-2 text-text-secondary">
                                <p><strong>Tipo:</strong> {result.data.type}</p>
                                <p><strong>Usuário:</strong> {result.data.user}</p>
                                {result.data.title && <p><strong>Promoção:</strong> {result.data.title}</p>}
                            </div>
                        )}
                    </div>
                )}

                {(result || error) && (
                    <button onClick={resetScanner} className="mt-4 w-full bg-accent text-white font-bold py-3 px-4 rounded-lg">
                        Escanear Novamente
                    </button>
                )}
                 <button onClick={() => navigate(-1)} className="mt-2 w-full text-text-secondary">
                    Voltar
                </button>
            </div>
        </div>
    );
};

export default VerifyQrPage;