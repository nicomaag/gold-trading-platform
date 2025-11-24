import sqlite3
import json
import pandas as pd
from datetime import datetime

def analyze_backtest(backtest_id):
    conn = sqlite3.connect('backend/gold_trading.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT strategy_name, symbol, timeframe, params, total_return, max_drawdown, win_rate, trades, equity_curve FROM backtests WHERE id = ?", (backtest_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        print(f"Backtest {backtest_id} not found.")
        return

    strategy_name, symbol, timeframe, params, total_return, max_drawdown, win_rate, trades_json, equity_json = row
    
    print(f"=== Analysis of Backtest #{backtest_id} ===")
    print(f"Strategy: {strategy_name}")
    print(f"Symbol: {symbol} | Timeframe: {timeframe}")
    print(f"Params: {params}")
    print(f"Return: {total_return:.2f}%")
    print(f"Max Drawdown: {max_drawdown:.2f}%")
    print(f"Win Rate: {win_rate*100:.1f}%")
    
    trades = json.loads(trades_json)
    df_trades = pd.DataFrame(trades)
    
    if df_trades.empty:
        print("No trades found.")
        return

    print(f"\nTotal Trades: {len(df_trades)}")
    
    # Analyze Losers
    losers = df_trades[df_trades['pnl'] < 0].sort_values('pnl')
    print(f"\nTop 3 Worst Trades:")
    for _, t in losers.head(3).iterrows():
        print(f"  {t['entry_time']} | PnL: {t['pnl']:.2f}")

    # Analyze Winners
    winners = df_trades[df_trades['pnl'] > 0]
    print(f"\nTop 3 Best Trades:")
    for _, t in winners.sort_values('pnl', ascending=False).head(3).iterrows():
        print(f"  {t['entry_time']} | PnL: {t['pnl']:.2f}")

    # Analyze Consecutive Losses
    df_trades['is_loss'] = df_trades['pnl'] < 0
    df_trades['group'] = (df_trades['is_loss'] != df_trades['is_loss'].shift()).cumsum()
    consecutive_losses = df_trades[df_trades['is_loss']].groupby('group').size().max()
    print(f"\nMax Consecutive Losses: {consecutive_losses}")

if __name__ == "__main__":
    analyze_backtest(17)
