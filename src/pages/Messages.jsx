import { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';
import { messageService } from '../services';
import { getSocket, initSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      if (activeConversation._id) {
        fetchMessages(activeConversation._id);
      } else {
        // Optimistic conversation (not created yet on backend, or empty)
        setMessages([]);
      }
      setShowMobileList(false);
    } else {
      setShowMobileList(true);
    }
  }, [activeConversation]);

  useEffect(() => {
    const socket = getSocket();
    const roomId = activeConversation?._id;
    if (!socket || !roomId) return;

    socket.emit('joinConversation', roomId);

    return () => {
      socket.emit('leaveConversation', roomId);
    };
  }, [activeConversation?._id]);

  const [onlineUserIds, setOnlineUserIds] = useState([]);

  useEffect(() => {
    // Initialize socket with userId
    if (user?._id) {
      // Disconnect existing if any (optional safety) or relying on init check
      // initSocket handles singleton, but we need to ensure query params are set if creating new
      const socket = initSocket(localStorage.getItem('token'), user._id);

      const handleOnlineUsers = (users) => {
        setOnlineUserIds((users || []).map((id) => String(id)));
      };

      const handleReconnect = () => {
        socket.emit('requestOnlineUsers');
      };

      socket.on('getOnlineUsers', handleOnlineUsers);
      socket.on('connect', handleReconnect);
      socket.emit('requestOnlineUsers');

      return () => {
        socket.off('getOnlineUsers', handleOnlineUsers);
        socket.off('connect', handleReconnect);
      };
    }
  }, [user]);

  // Socket listener for messages calling initSocket again just returns the instance
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (data) => {
      const { message, conversationId } = data;

      // Update messages if looking at this conversation
      if (activeConversation?._id === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(message?._id))) return prev;
          return [...prev, message];
        });
        messageService.markAsRead(conversationId);
      }

      // Update conversation last message in list
      setConversations((prev) => {
        const index = prev.findIndex(c => c._id === conversationId);
        if (index === -1) {
          // New conversation? Fetch it or refresh list
          fetchConversations();
          return prev;
        }
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          lastMessage: {
            text: message.text || (message.mediaUrl ? 'Sent an attachment' : ''),
            sender: message.sender._id || message.sender,
            createdAt: message.createdAt
          },
          updatedAt: message.createdAt
        };
        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [activeConversation]);

  const fetchConversations = async () => {
    try {
      const data = await messageService.listConversations();
      setConversations(data.conversations);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id) => {
    setMessagesLoading(true);
    try {
      const data = await messageService.getMessages(id);
      // Backend returns newest first usually, revert or keep depending on UI
      // We want oldest first for chat window
      const msgs = data.messages || [];
      setMessages([...msgs].reverse());

      messageService.markAsRead(id);
    } catch (error) {
      console.error(error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (content) => {
    if (!activeConversation) return;
    try {
      let convId = activeConversation._id;

      // If it's a temp optimistic conversation, create it first?
      // Actually ConversationList handles creation before passing here usually.

      const data = await messageService.sendMessage(convId, content);
      const newMsg = data.message;

      setMessages(prev => {
        if (prev.some((m) => String(m._id) === String(newMsg?._id))) return prev;
        return [...prev, newMsg];
      });

      // Update list last message
      setConversations((prev) => {
        const updated = [...prev];
        const index = updated.findIndex(c => c._id === convId);
        if (index !== -1) {
          const textPreview = typeof content === 'string'
            ? content
            : (content.text || (content.mediaUrl ? 'Sent an attachment' : ''));

          updated[index] = {
            ...updated[index],
            lastMessage: {
              text: textPreview,
              sender: user._id,
              createdAt: newMsg.createdAt
            },
            updatedAt: newMsg.createdAt
          };
          return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }
        return prev;
      });

    } catch (error) {
      console.error('Failed to send', error);
    }
  };

  const handleStartChat = (conversation) => {
    // Check if already in list
    const existing = conversations.find(c => c._id === conversation._id);
    if (!existing) {
      setConversations([conversation, ...conversations]);
    }
    setActiveConversation(conversation);
    setShowMobileList(false);
  };

  const handleDeleteChat = async (conversationId) => {
    try {
      await messageService.deleteConversation(conversationId);
      setConversations(conversations.filter(c => c._id !== conversationId));
      setActiveConversation(null);
      setShowMobileList(true); // Go back to list on mobile
    } catch (error) {
      console.error('Failed to delete chat', error);
    }
  };

  return (
    <MainLayout showRightSidebar={false} wide>
      <div className="flex h-[calc(100vh-5.5rem)] min-h-[620px] w-full min-w-0 bg-white/95 shadow-[0_14px_40px_rgba(15,23,42,0.08)] overflow-hidden border-y border-blue-100 lg:border lg:rounded-l-2xl">

        {/* Left Sidebar: Conversations & Search */}
        <div className={`w-full md:w-[350px] lg:w-[390px] xl:w-[420px] flex flex-col border-r border-blue-100 bg-white ${showMobileList ? 'flex' : 'hidden md:flex'
          }`}>
          <ConversationList
            conversations={conversations}
            activeId={activeConversation?._id}
            onSelect={setActiveConversation}
            onStartNewChat={handleStartChat}
          />
        </div>

        {/* Center: Chat Window - Expanded */}
        <div className={`flex-1 flex flex-col bg-[linear-gradient(180deg,#f8fbff_0%,#f2f7ff_100%)] relative min-w-0 ${!showMobileList ? 'flex' : 'hidden md:flex'
          }`}>
          {!showMobileList && (
            <div className="md:hidden bg-white border-b border-blue-100 p-2 flex items-center gap-2">
              <button onClick={() => {
                setShowMobileList(true);
                setActiveConversation(null);
              }} className="p-2 hover:bg-blue-50 rounded-full">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          )}

          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={messagesLoading}
            onlineUserIds={onlineUserIds}
            onDeleteChat={handleDeleteChat}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Messages;
