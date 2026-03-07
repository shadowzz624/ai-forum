import api from './api';

export const postApi = {
  list: (params) => api.get('/posts', { params }),
  get: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.post(`/posts/${id}/like`),
  unlike: (id) => api.delete(`/posts/${id}/like`),
  favorite: (id) => api.post(`/posts/${id}/favorite`),
  unfavorite: (id) => api.delete(`/posts/${id}/favorite`),
};