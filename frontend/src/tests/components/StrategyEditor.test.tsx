import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StrategyEditor } from '../../components/StrategyEditor';

describe('StrategyEditor', () => {
    const mockOnSave = vi.fn();
    const initialCode = 'console.log("test");';

    beforeEach(() => {
        mockOnSave.mockClear();
    });

    it('renders with initial code', () => {
        render(<StrategyEditor initialCode={initialCode} onSave={mockOnSave} />);

        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue(initialCode);
    });

    it('shows save button as disabled when no changes', () => {
        render(<StrategyEditor initialCode={initialCode} onSave={mockOnSave} />);

        const saveButton = screen.getByRole('button', { name: /save changes/i });
        expect(saveButton).toBeDisabled();
    });

    it('enables save button when code is modified', () => {
        render(<StrategyEditor initialCode={initialCode} onSave={mockOnSave} />);

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'new code' } });

        const saveButton = screen.getByRole('button', { name: /save changes/i });
        expect(saveButton).not.toBeDisabled();
    });

    it('calls onSave when save button is clicked', async () => {
        render(<StrategyEditor initialCode={initialCode} onSave={mockOnSave} />);

        const textarea = screen.getByRole('textbox');
        const newCode = 'modified code';
        fireEvent.change(textarea, { target: { value: newCode } });

        const saveButton = screen.getByRole('button', { name: /save changes/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith(newCode);
        });
    });

    it('shows unsaved changes warning when dirty', () => {
        render(<StrategyEditor initialCode={initialCode} onSave={mockOnSave} />);

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'new code' } });

        expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument();
    });

    it('shows saving state when isSaving is true', () => {
        render(<StrategyEditor initialCode={initialCode} onSave={mockOnSave} isSaving={true} />);

        expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
    });
});
