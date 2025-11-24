import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BotsPage from '../../pages/BotsPage';
import { api } from '../../api/client';

// Mock the API
vi.mock('../../api/client', () => ({
    api: {
        getBots: vi.fn(),
        createBot: vi.fn(),
        stopBot: vi.fn(),
        getStrategies: vi.fn(),
    }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('BotsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders bots list', async () => {
        const mockBots = [
            {
                id: 'bot-1',
                strategy_name: 'example_ma_cross',
                symbol: 'XAU_USD',
                timeframe: 'H1',
                status: 'running',
                start_time: '2024-01-01T00:00:00',
                params: {},
                created_at: '2024-01-01T00:00:00'
            }
        ];

        (api.getBots as any).mockResolvedValue(mockBots);

        render(
            <BrowserRouter>
                <BotsPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('example_ma_cross')).toBeInTheDocument();
        });
    });

    it('shows empty state when no bots', async () => {
        (api.getBots as any).mockResolvedValue([]);

        render(
            <BrowserRouter>
                <BotsPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/no bots/i)).toBeInTheDocument();
        });
    });

    it('displays bot status correctly', async () => {
        const mockBots = [
            {
                id: 'bot-1',
                strategy_name: 'test_strategy',
                symbol: 'XAU_USD',
                timeframe: 'H1',
                status: 'running',
                start_time: '2024-01-01T00:00:00',
                params: {},
                created_at: '2024-01-01T00:00:00'
            },
            {
                id: 'bot-2',
                strategy_name: 'test_strategy',
                symbol: 'XAU_USD',
                timeframe: 'H1',
                status: 'stopped',
                start_time: '2024-01-01T00:00:00',
                params: {},
                created_at: '2024-01-01T00:00:00'
            }
        ];

        (api.getBots as any).mockResolvedValue(mockBots);

        render(
            <BrowserRouter>
                <BotsPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            // Status text is uppercase in the component
            expect(screen.getByText('RUNNING')).toBeInTheDocument();
            expect(screen.getByText('STOPPED')).toBeInTheDocument();
        });
    });

    it('shows correct bot parameters', async () => {
        const mockBots = [
            {
                id: 'bot-1',
                strategy_name: 'test_strategy',
                symbol: 'XAU_USD',
                timeframe: 'H1',
                status: 'running',
                start_time: '2024-01-01T00:00:00',
                params: {
                    short_window: 10,
                    long_window: 30,
                    position_size: 0.1
                },
                created_at: '2024-01-01T00:00:00'
            }
        ];

        (api.getBots as any).mockResolvedValue(mockBots);

        render(
            <BrowserRouter>
                <BotsPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('XAU_USD')).toBeInTheDocument();
            expect(screen.getByText('H1')).toBeInTheDocument();
        });
    });

    it('does not show stop button for stopped bots', async () => {
        const mockBots = [
            {
                id: 'bot-1',
                strategy_name: 'test_strategy',
                symbol: 'XAU_USD',
                timeframe: 'H1',
                status: 'stopped',
                start_time: '2024-01-01T00:00:00',
                params: {},
                created_at: '2024-01-01T00:00:00'
            }
        ];

        (api.getBots as any).mockResolvedValue(mockBots);

        render(
            <BrowserRouter>
                <BotsPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('test_strategy')).toBeInTheDocument();
        });

        // Stop button should not be present for stopped bots
        const stopButton = screen.queryByTitle('Stop Bot');
        expect(stopButton).not.toBeInTheDocument();
    });
});
