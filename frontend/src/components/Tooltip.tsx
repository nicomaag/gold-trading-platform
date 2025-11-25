import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
    content: string;
}

export const Tooltip = ({ content }: TooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div 
            className="relative inline-block ml-2"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600" />
            {isVisible && (
                <div className="absolute z-10 w-64 p-2 mt-1 text-sm font-normal text-white bg-gray-800 rounded-lg shadow-lg -left-28 top-full">
                    {content}
                    <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 -top-1 left-1/2 -translate-x-1/2"></div>
                </div>
            )}
        </div>
    );
};
