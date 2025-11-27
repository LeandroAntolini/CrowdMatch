import React from 'react';
import { Promotion, PromotionClaim } from '../types';
import { CheckCircle, Clock, Ticket, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PromotionClaimStatusProps {
    promotion: Promotion;
    claim?: PromotionClaim;
    claimOrder?: number; // Ordem de reivindicação (se for um vencedor)
}

// Função auxiliar para formatar a data
const formatClaimDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const PromotionClaimStatus: React.FC<PromotionClaimStatusProps> = ({ promotion, claim, claimOrder }) => {
    const isClaimed = !!claim;
    
    // Determina se é um vencedor com base na ordem de reivindicação e no limite
    const finalClaimOrder = claimOrder || 0;
    const isWinner = finalClaimOrder > 0 && finalClaimOrder <= promotion.limitCount;
    
    // String de validação para o QR Code: claimId|userId|promotionId|claimedAt
    const qrCodeValue = claim 
        ? `${claim.id}|${claim.userId}|${claim.promotionId}|${claim.claimedAt}`
        : 'N/A';

    const getStatusDisplay = () => {
        if (!isClaimed) {
            return (
                <div className="flex items-center text-sm text-text-secondary">
                    <Clock size={16} className="mr-2 text-yellow-400" />
                    <span>Ação necessária para reivindicar.</span>
                </div>
            );
        }

        if (claim.status === 'redeemed') {
            return (
                <div className="flex items-center text-sm text-green-400 font-semibold">
                    <CheckCircle size={16} className="mr-2" />
                    <span>Resgatado! Aproveite.</span>
                </div>
            );
        }
        
        if (isWinner) {
            return (
                <div className="flex items-center text-sm text-green-400 font-semibold">
                    <Ticket size={16} className="mr-2" />
                    <span>Parabéns! Você foi o {finalClaimOrder}º a reivindicar.</span>
                </div>
            );
        }
        
        // Reivindicado, mas não vencedor (limite atingido)
        return (
            <div className="flex items-center text-sm text-red-400 font-semibold">
                <AlertTriangle size={16} className="mr-2" />
                <span>Reivindicado, mas o limite de {promotion.limitCount} foi atingido.</span>
            </div>
        );
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-accent/50 mb-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary">{promotion.title}</h3>
                <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                    {promotion.promotionType === 'FIRST_N_GOING' ? 'Para quem VAI' : 'Para quem está AQUI'}
                </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">{promotion.description}</p>
            <p className="text-xs text-text-secondary mt-2">Limite: {promotion.limitCount} pessoas.</p>
            
            <div className="mt-3 pt-3 border-t border-gray-700">
                {getStatusDisplay()}
                
                {isClaimed && (
                    <div className="mt-3 space-y-2">
                        <p className="text-xs text-text-secondary">Reivindicado em: {formatClaimDate(claim.claimedAt)}</p>
                        {finalClaimOrder > 0 && (
                            <p className="text-xs text-text-secondary font-bold">Sua Ordem: {finalClaimOrder}</p>
                        )}
                        
                        {/* QR Code para validação do estabelecimento */}
                        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg mt-4">
                            <p className="text-xs text-gray-800 mb-2 font-semibold">CÓDIGO DE VALIDAÇÃO</p>
                            <QRCodeSVG 
                                value={qrCodeValue} 
                                size={128} 
                                level="H" 
                            />
                            <p className="text-xs text-gray-600 mt-2 break-all">ID: {claim.id.substring(0, 8)}...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromotionClaimStatus;