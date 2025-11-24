import React, { useState, useEffect } from 'react';

interface StrategyEditorProps {
    initialCode: string;
    onSave: (code: string) => Promise<void>;
    isSaving?: boolean;
}

export const StrategyEditor: React.FC<StrategyEditorProps> = ({ initialCode, onSave, isSaving = false }) => {
    const [code, setCode] = useState(initialCode);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setCode(initialCode);
        setIsDirty(false);
    }, [initialCode]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCode(e.target.value);
        setIsDirty(true);
    };

    const handleSave = async () => {
        await onSave(code);
        setIsDirty(false);
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Strategy Code</h3>
                <button
                    onClick={handleSave}
                    disabled={!isDirty || isSaving}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${!isDirty || isSaving
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
            <div className="flex-1 relative rounded-md overflow-hidden border border-gray-700">
                <textarea
                    value={code}
                    onChange={handleChange}
                    className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    spellCheck={false}
                />
            </div>
            {isDirty && (
                <p className="text-sm text-yellow-500">
                    You have unsaved changes.
                </p>
            )}
        </div>
    );
};
