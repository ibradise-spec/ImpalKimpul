import { api } from './client.js';
import { toQuery } from '../utils/query.js';

export const fetchItems = (params, signal) => api(`/items${toQuery(params)}`, { signal });
export const fetchItem = (id, signal) => api(`/items/${id}`, { signal });
export const fetchCategories = (signal) => api('/categories', { signal });
export const fetchColors = (signal) => api('/colors', { signal });
export const fetchPosLocations = (signal) => api('/pos-locations', { signal });
