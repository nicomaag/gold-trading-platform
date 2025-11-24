# Notification System Usage Examples

## Basic Toast Notifications

```tsx
import { useNotifications } from '../contexts/NotificationContext';

const MyComponent = () => {
  const notifications = useNotifications();
  
  // Success toast
  notifications.success('Backtest completed successfully!');
  
  // Error toast
  notifications.error('Failed to start bot');
  
  // Info toast
  notifications.info('Fetching data from Twelve Data API...');
  
  // Warning toast
  notifications.warning('Trading is disabled in test mode');
};
```

## Toast with Title

```tsx
notifications.success('Strategy saved successfully', 'Success');
notifications.error('Connection failed', 'Network Error');
```

## Complex Notifications with CTAs

```tsx
notifications.addNotification({
  type: 'warning',
  title: 'Confirm Deletion',
  message: 'Are you sure you want to delete this backtest?',
  duration: 0, // Persistent until user acts
  actions: [
    {
      label: 'Delete',
      variant: 'primary',
      onClick: () => {
        // Handle deletion
        api.deleteBacktest(id);
      }
    },
    {
      label: 'Cancel',
      variant: 'secondary',
      onClick: () => {
        // Just close notification
      }
    }
  ]
});
```

## Custom Duration

```tsx
notifications.addNotification({
  type: 'info',
  message: 'This will stay for 10 seconds',
  duration: 10000
});
```
