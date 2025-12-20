import { useRef, useState, useEffect } from 'react';
import { Send, Paperclip, MoreVertical, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { getSocket } from '../../utils/socket';
import { uploadService } from '../../services';
import toast from 'react-hot-toast';

const ChatWindow = ({ conversation, messages, onSendMessage, loading, onlineUserIds = [], onDeleteChat }) => {
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const otherParticipant = conversation?.participants?.find(p => String(p._id) !== String(user?._id)) || conversation?.participants?.[0];
    const isOnline = otherParticipant && onlineUserIds.includes(String(otherParticipant._id));

    useEffect(() => {
        const socket = getSocket();
        if (!socket || !conversation) return;

        const handleTyping = ({ conversationId, typistId }) => {
            if (conversationId === conversation._id && typistId !== user._id) {
                setIsTyping(true);
            }
        };

        const handleStopTyping = ({ conversationId, typistId }) => {
            if (conversationId === conversation._id && typistId !== user._id) {
                setIsTyping(false);
            }
        };

        socket.on('typing', handleTyping);
        socket.on('stopTyping', handleStopTyping);

        return () => {
            socket.off('typing', handleTyping);
            socket.off('stopTyping', handleStopTyping);
        };
    }, [conversation, user._id]);

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);

        const socket = getSocket();
        if (socket && conversation) {
            socket.emit('typing', { conversationId: conversation._id, typistId: user._id });

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stopTyping', { conversationId: conversation._id, typistId: user._id });
            }, 2000);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        onSendMessage(newMessage);
        setNewMessage('');
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size too large (max 5MB)');
            return;
        }

        setUploading(true);
        try {
            const data = await uploadService.uploadImage(file);
            // Send as object with mediaUrl
            await onSendMessage({
                text: '',
                mediaUrl: data.url
            });
            toast.success('Image sent');
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Failed to send image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
                <div className="text-center text-gray-500">
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm">or start a new chat from the suggestions</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg">
                        {otherParticipant?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{otherParticipant?.name}</h3>
                        {isOnline ? (
                            <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                Online
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400 font-medium">Offline</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400 relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this conversation? It will be removed from your list.')) {
                                        onDeleteChat(conversation._id);
                                    }
                                    setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, idx) => {
                            const isMe = msg.sender._id === user._id || msg.sender === user._id;

                            return (
                                <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                    <div className={`flex max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                                        {!isMe && (
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-600 font-bold text-xs self-end mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {otherParticipant?.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        <div className={`p-3 rounded-2xl shadow-sm ${isMe
                                            ? 'bg-indigo-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                            }`}>
                                            {msg.mediaUrl && (
                                                <div className="mb-2 rounded-lg overflow-hidden">
                                                    <img
                                                        src={msg.mediaUrl}
                                                        alt="Attached media"
                                                        className="max-w-full max-h-60 object-cover"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            )}
                                            {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                {format(new Date(msg.createdAt), 'h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 rounded-2xl p-3 rounded-bl-none text-gray-500 text-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className={`p-2 text-gray-400 hover:text-indigo-600 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
