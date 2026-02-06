import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  timestamp: number;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string, title?: string) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (type, message, title) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => {
      // 添加新通知，并保持最多显示3条（实际上我们可以在组件层控制显示数量，这里保留所有或者限制一个较大的数量）
      // 为了避免内存泄漏，限制最多保留 10 条
      const newNotifications = [...state.notifications, { id, type, message, title, timestamp: Date.now() }].slice(-10);
      return { notifications: newNotifications };
    });

    // 自动移除 (5秒后)
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 5000);
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
