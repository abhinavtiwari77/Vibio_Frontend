import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User, UserPlus, UserCheck } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services';
import toast from 'react-hot-toast';

const Connections = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('type') || 'followers';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?._id) {
            fetchConnections();
        }
    }, [user?._id, activeTab]);

    const fetchConnections = async () => {
        setLoading(true);
        try {
            const data = await userService.getUserNetwork(user._id, activeTab);
            setUsers(data.users);
        } catch (error) {
            console.error('Error fetching connections:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (targetId) => {
        try {
            await userService.toggleFollow(targetId);
            // Determine action based on current state (simple toggle for now)
            // For better UX, we might want to track follow status locally for each user in list
            toast.success('Follow status updated');
            fetchConnections(); // Refresh list
        } catch (error) {
            console.error('Follow error:', error);
            toast.error('Failed to update follow status');
        }
    };

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('followers')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'followers'
                                ? 'text-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {activeTab === 'followers' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
                        )}
                        Followers
                    </button>
                    <button
                        onClick={() => setActiveTab('following')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'following'
                                ? 'text-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {activeTab === 'following' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
                        )}
                        Following
                    </button>
                </div>

                {/* Users List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : users.length > 0 ? (
                    <div className="space-y-4">
                        {users.map((person) => (
                            <div key={person._id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg flex-shrink-0">
                                        {person.profilePicUrl ? (
                                            <img
                                                src={person.profilePicUrl}
                                                alt={person.name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span>{person.name?.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{person.name}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-1">{person.bio || 'No bio'}</p>
                                    </div>
                                </div>
                                {/* 
                  Optional: Add Follow/Unfollow button here. 
                  Complexity: Need to know if *I* follow *them* (for 'followers' tab logic).
                  For 'following' tab, the button would be 'Unfollow'.
                  For 'followers' tab, it might be 'Follow Back' or 'Following'.
                  Simplifying for V1: Just showing the list.
                */}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No {activeTab} yet</h3>
                        <p className="text-gray-500 text-sm">
                            {activeTab === 'followers'
                                ? "You don't have any followers yet."
                                : "You aren't following anyone yet."}
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Connections;
