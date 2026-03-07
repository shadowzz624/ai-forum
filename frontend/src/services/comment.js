import api from './api';

export const commentApi = {
  list: (postId, params) => api.get(`/posts/${postId}/comments`, { params }),
  create: (postId, data) => api.post(`/posts/${postId}/comments`, data),
  update: (id, data) => api.put(`/comments/${id}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
  like: (id) => api.post(`/comments/${id}/like`),
  unlike: (id) => api.delete(`/comments/${id}/like`),
};