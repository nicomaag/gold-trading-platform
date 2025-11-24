import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlayCircle, Bot, Activity, BarChart2, TrendingUp } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { path: '/strategies', label: 'Strategies', icon: <LayoutDashboard size={20} /> },
        { path: '/backtests', label: 'Backtests', icon: <PlayCircle size={20} /> },
        { path: '/bots', label: 'Live Bots', icon: <Bot size={20} /> },
        { path: '/market', label: 'Market', icon: <BarChart2 size={20} /> },
        { path: '/metrics', label: 'Metrics', icon: <TrendingUp size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
                <div className="p-6 flex items-center gap-2 border-b border-gray-700">
                    <Activity className="text-yellow-500" />
                    <h1 className="text-xl font-bold text-yellow-500">Gold Trader</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.startsWith(item.path)
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : 'hover:bg-gray-700 text-gray-400 hover:text-white'
                                }`}
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-700 text-xs text-gray-500 text-center">
                    v0.1.0 Alpha
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-900">
                <div className="container mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
