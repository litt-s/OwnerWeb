import { api } from '../api';

export const fetchPublicArticles = () =>
  api('/api/articles').then((data) => data.articles || []);

export const fetchPublicArticle = (id) =>
  api(`/api/articles/${encodeURIComponent(id)}`).then((data) => data.article);
