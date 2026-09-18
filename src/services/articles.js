import { api } from '../api';

export const fetchPublicArticles = () =>
  api('/api/articles').then((data) => data.articles || []);

export const fetchPublicArticle = (id) =>
  api(`/api/articles/${encodeURIComponent(id)}`).then((data) => data.article);

export const fetchAdminArticles = (token) =>
  api('/api/admin/articles', { token }).then((data) => data.articles || []);

export const createArticle = (payload, token) =>
  api('/api/admin/articles', { method: 'POST', body: payload, token }).then((data) => data.article);

export const updateArticle = (id, payload, token) =>
  api(`/api/admin/articles/${encodeURIComponent(id)}`, { method: 'PUT', body: payload, token })
    .then((data) => data.article);

export const deleteArticle = (id, token) =>
  api(`/api/admin/articles/${encodeURIComponent(id)}`, { method: 'DELETE', token });
