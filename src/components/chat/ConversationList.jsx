import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { userService, messageService } from '../../services';
import { Search, Edit, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ConversationList = ({ conversations, activeId, onSelect, onStartNewChat }) => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.trim()) {
                handleSearch();
            } else {
                setSearchResults([]);
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = async () => {
        setIsSearching(true);
        setLoading(true);
        try {
            const data = await userService.searchUsers(searchQuery);
            // Filter out self
            const filtered = data.users.filter(u => u._id !== user._id);
            setSearchResults(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const startChatWithUser = async (targetUser) => {
        try {
            // Check if we already have a conversation with this user in the existing list
            const existing = conversations.find(c =>
                c.participants.some(p => String(p._id || p) === String(targetUser._id))
            );

            if (existing) {
                onSelect(existing);
                setSearchQuery(''); // Clear search to show chat
            } else {
                // Create new
                const res = await messageService.createConversation([targetUser._id]);
                onStartNewChat(res.conversation);
                setSearchQuery('');
            }
        } catch (error) {
            if (error.response?.status === 403) {
                toast.error("You must be connected to chat.");
            } else {
                toast.error("Failed to start chat.");
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full md:w-80 lg:w-96 flex-shrink-0">
            <div className="p-4 border-b border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                    <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                        <Edit className="w-5 h-5" />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search people..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isSearching ? (
                    // Search Results
                    <div className="divide-y divide-gray-50">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <p>No users found</p>
                            </div>
                        ) : (
                            searchResults.map(u => (
                                <button
                                    key={u._id}
                                    onClick={() => startChatWithUser(u)}
                                    className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold flex-shrink-0 overflow-hidden">
                                        {u.profilePicUrl ? (
                                            <img src={u.profilePicUrl} alt={u.name} className="w-full h-full object-cover" />
                                        ) : (
                                            u.name?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{u.bio || 'Wellness member'}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    // Conversation List (Filtered)
                    (() => {
                        // FILTER: Only show chats with messages OR the currently active chat (created in this session)
                        const visibleConversations = conversations.filter(c =>
                            (c.lastMessage && (c.lastMessage.text || c.lastMessage.mediaUrl)) || c._id === activeId
                        );

                        return visibleConversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <p>No messages yet.</p>
                                <p className="text-sm mt-2">Search above to find people!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {visibleConversations.map((conv) => {
                                    const otherParticipant = conv.participants.find(p => String(p._id) !== String(user?._id)) || conv.participants[0];

                                    // If participant is missing (deleted user or connection issue), skipping rendering might be safer
                                    if (!otherParticipant) return null;

                                    const isActive = activeId === conv._id;

                                    // Robust ID comparison for read status
                                    const userIdStr = String(user?._id);
                                    const readBy = conv.lastMessage?.readBy || [];
                                    const isRead = readBy.map(String).includes(userIdStr);

                                    return (
                                        <button
                                            key={conv._id}
                                            onClick={() => onSelect(conv)}
                                            className={`w-full p-4 flex items-center gap-3 transition-colors hover:bg-gray-50 ${isActive ? 'bg-indigo-50/50 border-r-2 border-indigo-600' : ''
                                                }`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold overflow-hidden">
                                                    {otherParticipant?.profilePicUrl ? (
                                                        <img src={otherParticipant.profilePicUrl} alt={otherParticipant.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (otherParticipant?.name?.charAt(0) || '?').toUpperCase()
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h3 className={`font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                        {otherParticipant?.name || 'Unknown User'}
                                                    </h3>
                                                    {conv.lastMessage && conv.lastMessage.createdAt && (
                                                        <span className="text-xs text-gray-400 flex-shrink-0">
                                                            {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-sm truncate ${isActive ? 'text-indigo-700/80' :
                                                    isRead ? 'text-gray-500' : 'text-gray-900 font-medium'
                                                    }`}>
                                                    {conv.lastMessage ? (
                                                        <>
                                                            {String(conv.lastMessage.sender) === String(user?._id) && 'You: '}
                                                            {conv.lastMessage.text || 'Sent an attachment'}
                                                        </>
                                                    ) : (
                                                        <span className="italic text-gray-400">Start a conversation</span>
                                                    )}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })()
                )}
            </div>
        </div>
    );
};

export default ConversationList;
