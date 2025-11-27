
import React from 'react';

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Carregando..." }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-12 h-12 border-4 border-t-primary border-surface rounded-full animate-spin"></div>
            <p className="mt-4 text-text-secondary">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
