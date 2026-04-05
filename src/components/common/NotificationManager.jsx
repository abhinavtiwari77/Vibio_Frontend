import { useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import toast from 'react-hot-toast';

const NotificationManager = () => {
    const { user } = useAuth();

    // Check permissions
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const handleNewNotification = useCallback((notif) => {
        // Prevent showing if user not logged in or disabled globally (though socket logic helps)
        if (!user) return;

        const prefs = user.notificationPreferences || {};

        // --- Filtering Logic based on Preferences ---
        // Defaults to true if pref is undefined
        const likesEnabled = prefs.emailLike ?? true; // Reusing 'email' pref for general 'notify' pref for now as requested "like popup"
        const commentsEnabled = prefs.emailComment ?? true;
        const followsEnabled = prefs.pushNewFollower ?? true;

        let shouldNotify = false;
        let title = 'New Notification';
        let body = '';

        if (notif.type === 'like_post' && likesEnabled) {
            shouldNotify = true;
            title = 'New Like';
            body = `${notif.sender?.name} liked your post`;
        } else if (notif.type === 'comment' && commentsEnabled) {
            shouldNotify = true;
            title = 'New Comment';
            body = `${notif.sender?.name} commented on your post`;
        } else if (notif.type === 'follow_request' && followsEnabled) {
            shouldNotify = true;
            title = 'New Follow Request';
            body = `${notif.sender?.name} sent you a follow request`;
        } else if (notif.type === 'follow' && followsEnabled) {
            shouldNotify = true;
            title = 'New Follower';
            body = `${notif.sender?.name} started following you`;
        } else if (notif.type === 'new_post') {
            // Check if there's a pref for this? leveraging pushNewFollower or a new one?
            // User requested "popup like social apps" - usually for all interactions.
            shouldNotify = true;
            title = 'New Post';
            body = `${notif.sender?.name} posted something new`;
        }

        if (shouldNotify) {
            // 1. Toast Notification (In-App)
            toast((t) => (
                <div onClick={() => toast.dismiss(t.id)} className="flex items-center gap-2 cursor-pointer">
                    <img
                        src={notif.sender?.profilePicUrl || `https://ui-avatars.com/api/?name=${notif.sender?.name}`}
                        className="w-8 h-8 rounded-full"
                        alt=""
                    />
                    <div>
                        <p className="font-semibold text-sm">{title}</p>
                        <p className="text-xs text-gray-500">{body}</p>
                    </div>
                </div>
            ), { duration: 4000, position: 'top-right' });

            // 2. Browser Notification (System Popup)
            // "popup come on other social apps" usually refers to Browser Notifications or Mobile Push
            if ('Notification' in window && Notification.permission === 'granted') {
                try {
                    new Notification(title, {
                        body: body,
                        icon: '/vite.svg', // Ideally user avatar or app logo
                        // tag: notif._id // Prevent duplicates
                    });
                } catch (e) {
                    console.error("Notification API error", e);
                }
            }
        }
    }, [user]);

    // Listen to 'newNotification' event
    useSocket('newNotification', handleNewNotification);

    return null; // This component handles side-effects only
};

export default NotificationManager;
