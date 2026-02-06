import React from 'react';
import { useNotificationStore, Notification } from '../store/notificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();

  // 只显示最近的3条，并且是倒序显示（最新的在最下面）
  // notifications 数组是按时间顺序添加的，最新的在最后
  // 我们取最后3条
  const displayNotifications = notifications.slice(-3);

  return (
    <div className="fixed bottom-24 right-4 z-[100] flex flex-col gap-2 w-72 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {displayNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const NotificationItem: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-4 h-4 text-luxury-green" />,
    error: <AlertCircle className="w-4 h-4 text-luxury-rose" />,
    warning: <AlertTriangle className="w-4 h-4 text-luxury-amber" />,
    info: <Info className="w-4 h-4 text-luxury-cyan" />,
  };

  const bgColors = {
    success: 'bg-void-panel border-luxury-green/30 shadow-luxury-green/10',
    error: 'bg-void-panel border-luxury-rose/30 shadow-luxury-rose/10',
    warning: 'bg-void-panel border-luxury-amber/30 shadow-luxury-amber/10',
    info: 'bg-void-panel border-luxury-cyan/30 shadow-luxury-cyan/10',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-start gap-2 p-3 rounded-lg border shadow-lg backdrop-blur-md ${bgColors[notification.type]}`}
    >
      <div className="mt-0.5 shrink-0">{icons[notification.type]}</div>
      <div className="flex-1 min-w-0">
        {notification.title && (
          <h4 className="text-xs font-bold text-white mb-0.5 font-sans">{notification.title}</h4>
        )}
        <p className="text-xs text-white/80 break-words leading-tight font-sans">{notification.message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-white/40 hover:text-white transition-colors shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
};

export default NotificationContainer;
