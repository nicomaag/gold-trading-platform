import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    message?: string;
    isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Loading...', isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-xl">
            <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
            <p className="text-lg font-medium text-white animate-pulse">{message}</p>
        </div>
    );
};
