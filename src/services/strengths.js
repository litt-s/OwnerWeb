import { api } from '../api';

export const fetchPublicStrengths = () =>
  api('/api/strengths').then((data) => data.strengths || []);

export const fetchAdminStrengths = (token) =>
  api('/api/admin/strengths', { token }).then((data) => data.strengths || []);

export const createStrength = (payload, token) =>
  api('/api/admin/strengths', { method: 'POST', body: payload, token }).then((data) => data.strength);

export const updateStrength = (id, payload, token) =>
  api(`/api/admin/strengths/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
    token,
  }).then((data) => data.strength);

export const deleteStrength = (id, token) =>
  api(`/api/admin/strengths/${encodeURIComponent(id)}`, { method: 'DELETE', token });
