import { api } from '../api';

export const fetchPublicSiteContent = () =>
  api('/api/content/site').then((data) => data.content);

export const fetchAdminSiteContent = (token) =>
  api('/api/admin/content/site', { token }).then((data) => data.content);

export const updateSiteContent = (payload, token) =>
  api('/api/admin/content/site', {
    method: 'PUT',
    body: payload,
    token,
  }).then((data) => data.content);
