// API service functions for Posts
import api from '../utils/api';

export const postService = {
  // Get feed
  getFeed: async (page = 1, limit = 10, filters = {}) => {
    let query = `/posts?page=${page}&limit=${limit}`;
    if (filters.community) query += `&community=${filters.community}`;
    if (filters.author) query += `&author=${filters.author}`;

    const response = await api.get(query);
    return response.data;
  },

  // Get single post
  getPost: async (postId) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  // Create post with media
  createPost: async (content, mediaFiles = [], mediaEdits = []) => {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('mediaEdits', JSON.stringify(mediaEdits || []));

    // Append all media files
    if (mediaFiles && mediaFiles.length > 0) {
      mediaFiles.forEach((file) => {
        formData.append('media', file);
      });
    }

    const response = await api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.post; // Return the post object
  },

  // Update post with media
  updatePost: async (postId, content, mediaFiles = [], mediaEdits = []) => {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('mediaEdits', JSON.stringify(mediaEdits || []));

    // Append all media files
    if (mediaFiles && mediaFiles.length > 0) {
      mediaFiles.forEach((file) => {
        formData.append('media', file);
      });
    }

    const response = await api.put(`/posts/${postId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete post
  deletePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },

  // Toggle like
  toggleLike: async (postId) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  // Get comments
  getComments: async (postId) => {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data;
  },

  // Add comment
  addComment: async (postId, content) => {
    const response = await api.post(`/posts/${postId}/comments`, { text: content });
    return response.data.comment;
  },

  // Delete comment
  deleteComment: async (commentId) => {
    const response = await api.delete(`/${commentId}`);
    return response.data;
  },

  // Edit comment
  editComment: async (commentId, content) => {
    const response = await api.put(`/${commentId}`, { text: content });
    return response.data;
  },
};
