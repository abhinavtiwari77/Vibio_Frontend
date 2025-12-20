import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { notificationService, userService } from '../services';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { Bell, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [notifData, reqData] = await Promise.all([
                notificationService.getNotifications(),
                userService.getFollowRequests()
            ]);

            setNotifications(notifData.notifications || []);
            setRequests(reqData.requests || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleFollowAction = async (userId, action) => {
        try {
            if (action === 'accept') {
                await userService.acceptFollowRequest(userId);
                toast.success('Request accepted');
                setRequests(prev => prev.filter(req => req._id !== userId));
            } else if (action === 'reject') {
                await userService.rejectFollowRequest(userId);
                toast.success('Request removed');
                setRequests(prev => prev.filter(req => req._id !== userId));
            } else if (action === 'unfollow') {
                // This would need a toggleFollow endpoint or similar
                // For now assuming we just show the state, actual logic requires checking current follow status
                // But typically notifications page "Unfollow" button un-follows immediately
                // We'll use toggleFollow
                await userService.toggleFollow(userId);
                toast.success('Unfollowed user');
            } else if (action === 'follow') {
                await userService.toggleFollow(userId);
                toast.success('Following user');
            }
            // In a real app we might update local state to flip the button, but simpler to just toast for now or refresh
        } catch (error) {
            console.error(error);
            toast.error('Action failed');
        }
    };

    const groupNotifications = (notifs) => {
        const newFollowers = [];
        const activity = {
            Today: [],
            Yesterday: [],
            Last7Days: [],
            Earlier: []
        };

        notifs.forEach(notif => {
            if (notif.type === 'follow') {
                newFollowers.push(notif);
                return;
            }

            const date = new Date(notif.createdAt);
            if (isToday(date)) {
                activity.Today.push(notif);
            } else if (isYesterday(date)) {
                activity.Yesterday.push(notif);
            } else if (isThisWeek(date)) {
                activity.Last7Days.push(notif);
            } else {
                activity.Earlier.push(notif);
            }
        });

        return { newFollowers, activity };
    };

    const { newFollowers, activity } = groupNotifications(notifications);
    const hasNotifications = notifications.length > 0 || requests.length > 0;

    if (loading) {
        return (
            <MainLayout showRightSidebar={false}>
                <div className="flex justify-center items-center min-h-[50vh]">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout showRightSidebar={false}>
            <div className="max-w-2xl mx-auto py-8 px-4">

                {!hasNotifications ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No notifications</h3>
                        <p className="text-gray-500 mt-1">Activity on your posts will show up here.</p>
                    </div>
                ) : (
                    <div className="space-y-8">

                        {/* New Followers Section */}
                        {(newFollowers.length > 0 || requests.length > 0) && (
                            <div>
                                <h2 className="text-gray-500 font-medium text-sm mb-4 uppercase tracking-wide">New Followers</h2>
                                <div className="space-y-4">
                                    {/* Requests (if any) */}
                                    {requests.map(req => (
                                        <div key={req._id} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${req._id}`)}>
                                                <img
                                                    src={req.profilePicUrl || `https://ui-avatars.com/api/?name=${req.name}`}
                                                    alt={req.name}
                                                    className="w-11 h-11 rounded-full object-cover"
                                                />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{req.name}</p>
                                                    <p className="text-sm text-gray-500">requested to follow you</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleFollowAction(req._id, 'accept')}
                                                    className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => handleFollowAction(req._id, 'reject')}
                                                    className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* New Follow Notifications */}
                                    {newFollowers.map(notif => (
                                        <div key={notif._id} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${notif.sender._id}`)}>
                                                <img
                                                    src={notif.sender?.profilePicUrl || `https://ui-avatars.com/api/?name=${notif.sender?.name}`}
                                                    alt={notif.sender?.name}
                                                    className="w-11 h-11 rounded-full object-cover"
                                                />
                                                <div>
                                                    <p className="text-sm text-gray-900">
                                                        <span className="font-semibold">{notif.sender?.name}</span> started following you
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleFollowAction(notif.sender._id, 'unfollow')} // Logic simplified for UI demo
                                                className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Unfollow
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Activity Sections */}
                        {Object.entries(activity).map(([label, items]) => (
                            items.length > 0 && (
                                <div key={label}>
                                    <h2 className="text-gray-500 font-medium text-sm mb-4 uppercase tracking-wide">
                                        {label === 'Last7Days' ? 'Last 7 Days' : label}
                                    </h2>
                                    <div className="space-y-4">
                                        {items.map(notif => (
                                            <div key={notif._id} className="flex items-center justify-between group">
                                                <div
                                                    className="flex items-center gap-3 cursor-pointer flex-1"
                                                    onClick={() => notif.post ? navigate(`/post/${notif.post._id}`) : null}
                                                >
                                                    <div className="relative">
                                                        <img
                                                            src={notif.sender?.profilePicUrl || `https://ui-avatars.com/api/?name=${notif.sender?.name}`}
                                                            alt={notif.sender?.name}
                                                            className="w-11 h-11 rounded-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-900 leading-snug">
                                                            <span className="font-semibold">{notif.sender?.name}</span>
                                                            {notif.type === 'like_post' && " liked your post"}
                                                            {notif.type === 'comment' && " commented on your post"}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {notif.type === 'like_post' && <span className="text-gray-500">On: {notif.post?.content?.substring(0, 20)}...</span>}
                                                            <span className="mx-1">·</span>
                                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Post Thumbnail on Right */}
                                                {notif.post && (
                                                    <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden ml-4">
                                                        {notif.post.mediaUrl ? (
                                                            notif.post.mediaUrl.includes('video') ? (
                                                                <video src={notif.post.mediaUrl} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <img src={notif.post.mediaUrl} alt="Post" className="w-full h-full object-cover" />
                                                            )
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-200">
                                                                Text
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}

                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Notifications;
