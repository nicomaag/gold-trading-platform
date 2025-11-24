import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import StrategiesPage from './pages/StrategiesPage';
import { StrategyDetailPage } from './pages/StrategyDetailPage';
import { StrategyCreatePage } from './pages/StrategyCreatePage';
import BacktestsPage from './pages/BacktestsPage';
import BacktestCreatePage from './pages/BacktestCreatePage';
import BacktestDetailPage from './pages/BacktestDetailPage';
import BotsPage from './pages/BotsPage';
import BotCreatePage from './pages/BotCreatePage';
import BotDetailPage from './pages/BotDetailPage';
import { MarketPage } from './pages/MarketPage';
import MetricsPage from './pages/MetricsPage';

import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/strategies" replace />} />
            <Route path="/strategies" element={<StrategiesPage />} />
            <Route path="/strategies/new" element={<StrategyCreatePage />} />
            <Route path="/strategies/:name" element={<StrategyDetailPage />} />

            <Route path="/backtests" element={<BacktestsPage />} />
            <Route path="/backtests/new" element={<BacktestCreatePage />} />
            <Route path="/backtests/:id" element={<BacktestDetailPage />} />

            <Route path="/bots" element={<BotsPage />} />
            <Route path="/bots/new" element={<BotCreatePage />} />
            <Route path="/bots/:id" element={<BotDetailPage />} />

            <Route path="/market" element={<MarketPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
