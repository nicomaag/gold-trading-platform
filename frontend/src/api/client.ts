import axios from 'axios';

// Environment variable for API URL, default to localhost:8000/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Types ---

export interface Strategy {
  name: string;
  description: string;
  class_name: string;
}

export interface BacktestRequest {
  strategy_name: string;
  symbol: string;
  timeframe: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  params: Record<string, any>;
}

export interface Trade {
  entry_time: string;
  exit_time?: string;
  side: 'buy' | 'sell';
  entry_price: number;
  exit_price?: number;
  volume: number;
  pnl?: number;
  status: 'open' | 'closed';
}

export interface EquityPoint {
  time: string;
  equity: number;
}

export interface Backtest {
  id: number;
  strategy_name: string;
  symbol: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  params: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_return?: number;
  max_drawdown?: number;
  win_rate?: number;
  trades_count?: number;
  equity_curve?: EquityPoint[];
  trades?: Trade[];
  created_at: string;
}

export interface BotCreateRequest {
  strategy_name: string;
  symbol: string;
  timeframe: string;
  params: Record<string, any>;
}

export interface Bot {
  id: string;
  strategy_name: string;
  symbol: string;
  timeframe: string;
  params: Record<string, any>;
  status: 'starting' | 'running' | 'stopped' | 'error';
  start_time?: string;
  last_update_time?: string;
  created_at: string;
}

// --- API Functions ---

export const api = {
  health: () => apiClient.get('/health'),
  
  // Strategies
  getStrategies: () => apiClient.get<Strategy[]>('/strategies').then(res => res.data),
  getStrategy: (name: string) => apiClient.get<Strategy>(`/strategies/${name}`).then(res => res.data),
  getStrategyCode: (name: string) => apiClient.get<{code: string}>(`/strategies/${name}/code`).then(res => res.data),
  updateStrategyCode: (name: string, code: string) => apiClient.put<{status: string, message: string}>(`/strategies/${name}/code`, { code }).then(res => res.data),
  createStrategy: (name: string, code: string) => apiClient.post<{status: string, message: string}>('/strategies', { name, code }).then(res => res.data),
  deleteStrategy: (name: string) => apiClient.delete<{status: string, message: string}>(`/strategies/${name}`).then(res => res.data),
  
  // Backtests
  runBacktest: (data: BacktestRequest) => apiClient.post<{id: number, status: string}>('/backtests', data).then(res => res.data),
  getBacktests: () => apiClient.get<Backtest[]>('/backtests').then(res => res.data),
  getBacktest: (id: string) => apiClient.get<Backtest>(`/backtests/${id}`).then(res => res.data),
  deleteBacktest: (id: string) => apiClient.delete<{status: string, message: string}>(`/backtests/${id}`).then(res => res.data),
  
  // Bots
  createBot: (data: BotCreateRequest) => apiClient.post<{id: string, status: string}>('/bots', data).then(res => res.data),
  getBots: () => apiClient.get<Bot[]>('/bots').then(res => res.data),
  getBot: (id: string) => apiClient.get<Bot>(`/bots/${id}`).then(res => res.data),
  stopBot: (id: string) => apiClient.post<{id: string, status: string}>(`/bots/${id}/stop`).then(res => res.data),
  deleteBot: (id: string) => apiClient.delete<{status: string, message: string}>(`/bots/${id}`).then(res => res.data),
};
