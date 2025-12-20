import { useState, useEffect } from 'react';
import { userService, messageService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, MessageCircle, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const UserSuggestions = ({ onStartChat, className = '' }) => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setUsers([]);
            return;
        }

        setLoading(true);
        try {
            const data = await userService.searchUsers(query);
            const filtered = data.users.filter(u => u._id !== user._id);
            setUsers(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (id) => {
        try {
            await userService.toggleFollow(id);
            toast.success('Follow request sent');
            // Refresh search results to show updated status
            handleSearch(searchQuery);
        } catch (error) {
            toast.error('Failed to update follow status');
        }
    };

    const handleChat = async (targetUser) => {
        try {
            const res = await messageService.createConversation([targetUser._id]);
            onStartChat(res.conversation);
        } catch (error) {
            if (error.response?.status === 403) {
                toast.error("You must be connected to chat.");
            } else {
                toast.error("Failed to start chat.");
            }
        }
    };

    return (
        <div className={`w-full md:w-80 border-l border-gray-200 bg-white h-full flex flex-col ${className}`}>
            <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3">New Chat</h3>
                <input
                    type="text"
                    placeholder="Search people..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                        {searchQuery ? 'No users found' : 'Search to find people'}
                    </div>
                ) : (
                    users.map((u) => {
                        const isFollowing = user.following?.includes(u._id);
                        const isRequested = user.sentRequests?.includes(u._id);

                        return (
                            <div key={u._id} className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                                    {u.profilePicUrl ? (
                                        <img src={u.profilePicUrl} alt={u.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span className="font-semibold text-sm">{u.name?.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm truncate">{u.name}</p>
                                    {u.bio && <p className="text-xs text-gray-400 truncate">{u.bio}</p>}
                                </div>
                                {isFollowing ? (
                                    <button
                                        onClick={() => handleChat(u)}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                        title="Message"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => !isRequested && handleFollow(u._id)}
                                        disabled={isRequested}
                                        className={`p-2 rounded-full transition-colors ${isRequested ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-50'
                                            }`}
                                        title={isRequested ? 'Request Pending' : 'Follow'}
                                    >
                                        {isRequested ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default UserSuggestions;
