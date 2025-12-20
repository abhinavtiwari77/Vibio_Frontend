import { useState, useEffect, useRef } from 'react';
import { Send, Loader, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const CommunityChat = ({ communityId, communityName }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Fetch initial messages
    fetchMessages();
  }, [communityId]);

  useEffect(() => {
    if (!socket || !communityId) return;

    console.log('Socket connected, joining community:', communityId);

    // Join community chat room
    socket.emit('joinCommunity', communityId);

    // Listen for new messages
    const handleMessage = (message) => {
      console.log('Received community message:', message);
      // Check if message already exists to prevent duplicates
      setMessages((prev) => {
        const exists = prev.some(m => m._id === message._id);
        if (exists) {
          console.log('Message already exists, skipping duplicate');
          return prev;
        }
        return [...prev, message];
      });
      setTimeout(scrollToBottom, 100);
    };

    socket.on('communityMessage', handleMessage);

    return () => {
      console.log('Leaving community:', communityId);
      socket.emit('leaveCommunity', communityId);
      socket.off('communityMessage', handleMessage);
    };
  }, [socket, communityId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/communities/${communityId}/messages`);
      setMessages(response.data.messages || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // If endpoint doesn't exist, just show empty state
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const text = messageText.trim();
    if (!text) return;

    setSending(true);
    try {
      const response = await api.post(`/communities/${communityId}/messages`, { text });
      const newMessage = response.data.message;

      // DON'T add to local state here - let Socket.IO handle it
      // This prevents duplicate messages

      // The backend will emit via Socket.IO and we'll receive it
      // through the 'communityMessage' listener

      setMessageText('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-3 mb-4 bg-white/50 border border-slate-200 rounded-xl p-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Users className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-600 mb-2">No messages yet</p>
            <p className="text-sm text-slate-500">Be the first to start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender?._id === user?._id || message.sender === user?._id;
              const showAvatar = index === 0 || messages[index - 1].sender?._id !== message.sender?._id;

              return (
                <div
                  key={message._id || index}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {showAvatar ? (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-semibold">
                        {message.sender?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    {showAvatar && !isOwnMessage && (
                      <span className="text-xs text-slate-600 font-medium mb-1 px-1">
                        {message.sender?.name || 'Unknown User'}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${isOwnMessage
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                        }`}
                    >
                      <p className="text-sm break-words">{message.text}</p>
                    </div>
                    <span className="text-xs text-slate-500 mt-1 px-1">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !messageText.trim()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
        >
          {sending ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default CommunityChat;
