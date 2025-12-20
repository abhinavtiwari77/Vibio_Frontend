// API service functions for Communities
import api from '../utils/api';

export const communityService = {
  // List all communities
  listCommunities: async (search = '') => {
    const response = await api.get(`/communities?search=${search}`);
    return response.data;
  },

  // Get single community
  getCommunity: async (identifier) => {
    const response = await api.get(`/communities/${identifier}`);
    return response.data;
  },

  // Create community
  createCommunity: async (communityData) => {
    const response = await api.post('/communities', communityData);
    return response.data;
  },

  // Update community
  updateCommunity: async (communityId, communityData) => {
    const response = await api.put(`/communities/${communityId}`, communityData);
    return response.data;
  },

  // Delete community
  deleteCommunity: async (communityId) => {
    const response = await api.delete(`/communities/${communityId}`);
    return response.data;
  },

  // Join community
  joinCommunity: async (communityId) => {
    const response = await api.post(`/communities/${communityId}/join`);
    return response.data;
  },

  // Leave community
  leaveCommunity: async (communityId) => {
    const response = await api.post(`/communities/${communityId}/leave`);
    return response.data;
  },

  // Approve join request
  approveRequest: async (communityId, userId) => {
    const response = await api.post(`/communities/${communityId}/requests/${userId}/approve`);
    return response.data;
  },

  // Reject join request
  rejectRequest: async (communityId, userId) => {
    const response = await api.post(`/communities/${communityId}/requests/${userId}/reject`);
    return response.data;
  },
  // Get pending requests
  getPendingRequests: async () => {
    const response = await api.get('/communities/requests/pending');
    return response.data;
  },
};
