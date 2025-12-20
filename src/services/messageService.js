// API service functions for Messages
import api from '../utils/api';

export const messageService = {
  // Delete conversation
  deleteConversation: async (id) => {
    const response = await api.delete(`/messages/${id}`);
    return response.data;
  },

  // Get all conversations
  listConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  // Create conversation
  createConversation: async (participantIds) => {
    const response = await api.post('/messages/conversations', {
      participantIds: Array.isArray(participantIds) ? participantIds : [participantIds],
    });
    return response.data;
  },

  // Get messages in conversation
  getMessages: async (conversationId) => {
    const response = await api.get(`/messages/${conversationId}`);
    return response.data;
  },

  // Send message
  sendMessage: async (conversationId, content) => {
    let payload = {};
    if (typeof content === 'string') {
      payload = { text: content };
    } else {
      payload = content; // Expecting { text, mediaUrl } or similar
    }
    const response = await api.post(`/messages/${conversationId}`, payload);
    return response.data;
  },

  // Mark as read
  markAsRead: async (conversationId) => {
    const response = await api.post(`/messages/${conversationId}/read`);
    return response.data;
  },
};
