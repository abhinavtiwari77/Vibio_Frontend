// API service functions for Users
import api from '../utils/api';

export const userService = {
  // Search users
  searchUsers: async (query) => {
    const response = await api.get(`/user?search=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get my profile
  getMyProfile: async () => {
    const response = await api.get('/user/me');
    return response.data;
  },

  // Update my profile
  updateMyProfile: async (formData) => {
    const response = await api.put('/user/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/user/${userId}`);
    return response.data;
  },

  // Toggle follow
  toggleFollow: async (userId) => {
    const response = await api.post(`/user/${userId}/follow`);
    return response.data;
  },

  // Get follow requests
  getFollowRequests: async () => {
    const response = await api.get('/user/requests/pending');
    return response.data;
  },

  // Accept follow request
  acceptFollowRequest: async (userId) => {
    const response = await api.post(`/user/requests/${userId}/accept`);
    return response.data;
  },

  // Reject follow request
  rejectFollowRequest: async (userId) => {
    const response = await api.post(`/user/requests/${userId}/reject`);
    return response.data;
  },

  // Toggle favorite
  toggleFavorite: async (postId) => {
    const response = await api.post(`/user/favorites/${postId}`);
    return response.data;
  },

  // Get favorites
  getFavorites: async () => {
    const response = await api.get('/user/favorites');
    return response.data;
  },

  // Get user network (followers/following)
  getUserNetwork: async (userId, type) => {
    const response = await api.get(`/user/${userId}/connections?type=${type}`);
    return response.data;
  },
};
