import { api } from './client.js';
import { toQuery } from '../utils/query.js';

export const login = (email, password) => api('/auth/login', { method: 'POST', body: { email, password } });
export const logout = () => api('/auth/logout', { method: 'POST' });
export const fetchMe = (signal) => api('/auth/me', { signal });

export const fetchStats = (signal) => api('/admin/stats', { signal });
export const fetchAdminItems = (params, signal) => api(`/admin/items${toQuery(params)}`, { signal });
export const createItem = (formData) => api('/admin/items', { method: 'POST', formData });
export const updateItem = (id, formData) => api(`/admin/items/${id}`, { method: 'PATCH', formData });
export const deleteItem = (id) => api(`/admin/items/${id}`, { method: 'DELETE' });
export const handoverItem = (id, body) => api(`/admin/items/${id}/handover`, { method: 'POST', body });
export const revertHandover = (id) => api(`/admin/items/${id}/handover`, { method: 'DELETE' });
export const analyzePhoto = (formData) => api('/admin/items/analyze', { method: 'POST', formData });
