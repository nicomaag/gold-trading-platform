import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
}

interface Notification {
    id: string;
    type: NotificationType;
    title?: string;
    message: string;
    duration?: number;
    actions?: NotificationAction[];
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = Math.random().toString(36).substring(7);
        const newNotification: Notification = {
            ...notification,
            id,
            duration: notification.duration ?? 5000,
        };

        setNotifications(prev => [...prev, newNotification]);

        // Auto-remove after duration (unless duration is 0 for persistent notifications)
        if (newNotification.duration && newNotification.duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, newNotification.duration);
        }
    }, [removeNotification]);

    const success = useCallback((message: string, title?: string) => {
        addNotification({ type: 'success', message, title });
    }, [addNotification]);

    const error = useCallback((message: string, title?: string) => {
        addNotification({ type: 'error', message, title, duration: 7000 });
    }, [addNotification]);

    const info = useCallback((message: string, title?: string) => {
        addNotification({ type: 'info', message, title });
    }, [addNotification]);

    const warning = useCallback((message: string, title?: string) => {
        addNotification({ type: 'warning', message, title, duration: 6000 });
    }, [addNotification]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                addNotification,
                removeNotification,
                success,
                error,
                info,
                warning,
            }}
        >
            {children}
            <NotificationContainer />
        </NotificationContext.Provider>
    );
};

const NotificationContainer: React.FC = () => {
    const { notifications, removeNotification } = useNotifications();

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md">
            {notifications.map(notification => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    );
};

interface NotificationItemProps {
    notification: Notification;
    onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
    const icons = {
        success: <CheckCircle size={20} />,
        error: <AlertCircle size={20} />,
        info: <Info size={20} />,
        warning: <AlertTriangle size={20} />,
    };

    const styles = {
        success: 'bg-green-500/10 border-green-500/50 text-green-400',
        error: 'bg-red-500/10 border-red-500/50 text-red-400',
        info: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
        warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400',
    };

    return (
        <div
            className={`${styles[notification.type]} border backdrop-blur-sm rounded-lg p-4 shadow-lg animate-slide-in-right`}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    {icons[notification.type]}
                </div>
                <div className="flex-1 min-w-0">
                    {notification.title && (
                        <h4 className="font-semibold mb-1">{notification.title}</h4>
                    )}
                    <p className="text-sm text-gray-300">{notification.message}</p>

                    {notification.actions && notification.actions.length > 0 && (
                        <div className="flex gap-2 mt-3">
                            {notification.actions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        action.onClick();
                                        onClose();
                                    }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${action.variant === 'primary'
                                            ? 'bg-white/20 hover:bg-white/30 text-white'
                                            : 'bg-white/10 hover:bg-white/20 text-gray-300'
                                        }`}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};
