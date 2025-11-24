import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../api/client';

// Mock axios module
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

// Import axios after mocking
import axios from 'axios';

// Get the mocked instance
const getMockAxios = () => {
  const createMock = axios.create as any;
  return createMock();
};

describe('API Client - Strategies', () => {
  let mockAxios: any;

  beforeEach(() => {
    mockAxios = getMockAxios();
    vi.clearAllMocks();
  });

  it('getStrategies returns list of strategies', async () => {
    const mockStrategies = [
      { name: 'test_strategy', description: 'Test Strategy', class_name: 'TestStrategy' },
      { name: 'ma_cross', description: 'MA Cross', class_name: 'MACross' }
    ];
    
    mockAxios.get.mockResolvedValue({ data: mockStrategies });
    
    const result = await api.getStrategies();
    
    expect(mockAxios.get).toHaveBeenCalledWith('/strategies');
    expect(result).toEqual(mockStrategies);
    expect(result).toHaveLength(2);
  });

  it('getStrategy returns single strategy', async () => {
    const mockStrategy = {
      name: 'test_strategy',
      description: 'Test Strategy',
      class_name: 'TestStrategy'
    };
    
    mockAxios.get.mockResolvedValue({ data: mockStrategy });
    
    const result = await api.getStrategy('test_strategy');
    
    expect(mockAxios.get).toHaveBeenCalledWith('/strategies/test_strategy');
    expect(result).toEqual(mockStrategy);
  });

  it('getStrategyCode returns strategy source code', async () => {
    const mockCode = { code: 'class TestStrategy(BaseStrategy):\n    pass' };
    
    mockAxios.get.mockResolvedValue({ data: mockCode });
    
    const result = await api.getStrategyCode('test_strategy');
    
    expect(mockAxios.get).toHaveBeenCalledWith('/strategies/test_strategy/code');
    expect(result.code).toContain('TestStrategy');
  });

  it('updateStrategyCode sends correct payload', async () => {
    const newCode = 'class UpdatedStrategy(BaseStrategy):\n    pass';
    const mockResponse = { status: 'ok', message: 'Strategy updated' };
    
    mockAxios.put.mockResolvedValue({ data: mockResponse });
    
    const result = await api.updateStrategyCode('test_strategy', newCode);
    
    expect(mockAxios.put).toHaveBeenCalledWith(
      '/strategies/test_strategy/code',
      { code: newCode }
    );
    expect(result.status).toBe('ok');
  });

  it('createStrategy sends correct payload', async () => {
    const strategyName = 'new_strategy';
    const strategyCode = 'class NewStrategy(BaseStrategy):\n    pass';
    const mockResponse = { status: 'ok', message: 'Strategy created' };
    
    mockAxios.post.mockResolvedValue({ data: mockResponse });
    
    const result = await api.createStrategy(strategyName, strategyCode);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/strategies', {
      name: strategyName,
      code: strategyCode
    });
    expect(result.status).toBe('ok');
  });

  it('deleteStrategy calls correct endpoint', async () => {
    const mockResponse = { status: 'ok', message: 'Strategy deleted' };
    
    mockAxios.delete.mockResolvedValue({ data: mockResponse });
    
    const result = await api.deleteStrategy('test_strategy');
    
    expect(mockAxios.delete).toHaveBeenCalledWith('/strategies/test_strategy');
    expect(result.status).toBe('ok');
  });
});

describe('API Client - Backtests', () => {
  let mockAxios: any;

  beforeEach(() => {
    mockAxios = getMockAxios();
    vi.clearAllMocks();
  });

  it('runBacktest sends correct payload', async () => {
    const backtestRequest = {
      strategy_name: 'test_strategy',
      symbol: 'XAU_USD',
      timeframe: 'H1',
      start: '2024-01-01T00:00:00',
      end: '2024-01-31T23:59:59',
      params: { short_window: 10, long_window: 30 }
    };
    const mockResponse = { id: 1, status: 'completed' };
    
    mockAxios.post.mockResolvedValue({ data: mockResponse });
    
    const result = await api.runBacktest(backtestRequest);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/backtests', backtestRequest);
    expect(result.id).toBe(1);
    expect(result.status).toBe('completed');
  });

  it('getBacktests returns list of backtests', async () => {
    const mockBacktests = [
      {
        id: 1,
        strategy_name: 'test_strategy',
        symbol: 'XAU_USD',
        timeframe: 'H1',
        status: 'completed',
        total_return: 15.5,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        params: {},
        created_at: '2024-01-01T00:00:00'
      }
    ];
    
    mockAxios.get.mockResolvedValue({ data: mockBacktests });
    
    const result = await api.getBacktests();
    
    expect(mockAxios.get).toHaveBeenCalledWith('/backtests');
    expect(result).toHaveLength(1);
    expect(result[0].total_return).toBe(15.5);
  });

  it('getBacktest returns single backtest with details', async () => {
    const mockBacktest = {
      id: 1,
      strategy_name: 'test_strategy',
      symbol: 'XAU_USD',
      timeframe: 'H1',
      status: 'completed',
      total_return: 15.5,
      max_drawdown: -5.2,
      win_rate: 0.65,
      trades_count: 20,
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      params: {},
      equity_curve: [
        { time: '2024-01-01T00:00:00', equity: 10000 },
        { time: '2024-01-02T00:00:00', equity: 10150 }
      ],
      trades: [
        {
          entry_time: '2024-01-01T10:00:00',
          exit_time: '2024-01-01T15:00:00',
          side: 'buy',
          entry_price: 2000,
          exit_price: 2010,
          volume: 0.1,
          pnl: 100,
          status: 'closed'
        }
      ],
      created_at: '2024-01-01T00:00:00'
    };
    
    mockAxios.get.mockResolvedValue({ data: mockBacktest });
    
    const result = await api.getBacktest('1');
    
    expect(mockAxios.get).toHaveBeenCalledWith('/backtests/1');
    expect(result.trades_count).toBe(20);
    expect(result.equity_curve).toHaveLength(2);
    expect(result.trades).toHaveLength(1);
  });
});

describe('API Client - Bots', () => {
  let mockAxios: any;

  beforeEach(() => {
    mockAxios = getMockAxios();
    vi.clearAllMocks();
  });

  it('createBot sends correct payload', async () => {
    const botRequest = {
      strategy_name: 'test_strategy',
      symbol: 'XAU_USD',
      timeframe: 'H1',
      params: { short_window: 10, long_window: 30, position_size: 0.1 }
    };
    const mockResponse = { id: 'bot-123', status: 'starting' };
    
    mockAxios.post.mockResolvedValue({ data: mockResponse });
    
    const result = await api.createBot(botRequest);
    
    expect(mockAxios.post).toHaveBeenCalledWith('/bots', botRequest);
    expect(result.id).toBe('bot-123');
    expect(result.status).toBe('starting');
  });

  it('getBots returns list of bots', async () => {
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
        strategy_name: 'another_strategy',
        symbol: 'EUR_USD',
        timeframe: 'M15',
        status: 'stopped',
        start_time: '2024-01-01T00:00:00',
        params: {},
        created_at: '2024-01-01T00:00:00'
      }
    ];
    
    mockAxios.get.mockResolvedValue({ data: mockBots });
    
    const result = await api.getBots();
    
    expect(mockAxios.get).toHaveBeenCalledWith('/bots');
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('running');
    expect(result[1].status).toBe('stopped');
  });

  it('getBot returns single bot details', async () => {
    const mockBot = {
      id: 'bot-123',
      strategy_name: 'test_strategy',
      symbol: 'XAU_USD',
      timeframe: 'H1',
      status: 'running',
      start_time: '2024-01-01T00:00:00',
      last_update_time: '2024-01-01T12:00:00',
      params: { short_window: 10, long_window: 30 },
      created_at: '2024-01-01T00:00:00'
    };
    
    mockAxios.get.mockResolvedValue({ data: mockBot });
    
    const result = await api.getBot('bot-123');
    
    expect(mockAxios.get).toHaveBeenCalledWith('/bots/bot-123');
    expect(result.id).toBe('bot-123');
    expect(result.status).toBe('running');
    expect(result.params.short_window).toBe(10);
  });

  it('stopBot calls correct endpoint', async () => {
    const mockResponse = { id: 'bot-123', status: 'stopped' };
    
    mockAxios.post.mockResolvedValue({ data: mockResponse });
    
    const result = await api.stopBot('bot-123');
    
    expect(mockAxios.post).toHaveBeenCalledWith('/bots/bot-123/stop');
    expect(result.status).toBe('stopped');
  });
});

describe('API Client - Error Handling', () => {
  let mockAxios: any;

  beforeEach(() => {
    mockAxios = getMockAxios();
    vi.clearAllMocks();
  });

  it('handles network errors', async () => {
    mockAxios.get.mockRejectedValue(new Error('Network Error'));
    
    await expect(api.getStrategies()).rejects.toThrow('Network Error');
  });

  it('handles 404 errors', async () => {
    const error = {
      response: {
        status: 404,
        data: { detail: 'Strategy not found' }
      }
    };
    
    mockAxios.get.mockRejectedValue(error);
    
    await expect(api.getStrategy('nonexistent')).rejects.toEqual(error);
  });

  it('handles 400 validation errors', async () => {
    const error = {
      response: {
        status: 400,
        data: { detail: 'Invalid parameters' }
      }
    };
    
    mockAxios.post.mockRejectedValue(error);
    
    await expect(api.createStrategy('', '')).rejects.toEqual(error);
  });

  it('handles 500 server errors', async () => {
    const error = {
      response: {
        status: 500,
        data: { detail: 'Internal server error' }
      }
    };
    
    mockAxios.post.mockRejectedValue(error);
    
    await expect(api.runBacktest({
      strategy_name: 'test',
      symbol: 'XAU_USD',
      timeframe: 'H1',
      start: '2024-01-01',
      end: '2024-01-31',
      params: {}
    })).rejects.toEqual(error);
  });
});
