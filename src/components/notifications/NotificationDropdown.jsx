import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            try {
                await notificationService.markAsRead(notification._id);
                setNotifications(prev =>
                    prev.map(n => n === notification ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (err) {
                console.error('Failed to mark read', err);
            }
        }

        setIsOpen(false);

        if (notification.type === 'new_post' && notification.post) {
            navigate(`/post/${notification.post._id || notification.post}`);
        } else if (notification.type === 'follow') {
            navigate(`/profile/${notification.sender._id}`);
        }
    };

    const markAllAsRead = async (e) => {
        e.stopPropagation();
        try {
            await notificationService.markAsRead('all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all read", err);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 origin-top-right"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${!notification.isRead ? 'bg-indigo-50/30' : ''
                                            }`}
                                    >
                                        <img
                                            src={notification.sender?.profilePicUrl || "https://ui-avatars.com/api/?name=" + notification.sender?.name}
                                            alt={notification.sender?.name}
                                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 truncate">
                                                <span className="font-semibold">{notification.sender?.name}</span>
                                                {notification.type === 'new_post' && " posted something new."}
                                                {notification.type === 'follow' && " started following you."}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
