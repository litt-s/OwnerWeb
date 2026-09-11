import { api } from '../api';

export const fetchPublicProjects = () =>
  api('/api/projects').then((data) => data.projects || []);

export const fetchPublicProject = (id) =>
  api(`/api/projects/${encodeURIComponent(id)}`).then((data) => data.project);

export const fetchAdminProjects = (token) =>
  api('/api/admin/projects', { token }).then((data) => data.projects || []);

export const createProject = (payload, token) =>
  api('/api/admin/projects', { method: 'POST', body: payload, token }).then((data) => data.project);

export const updateProject = (id, payload, token) =>
  api(`/api/admin/projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
    token,
  }).then((data) => data.project);

export const deleteProject = (id, token) =>
  api(`/api/admin/projects/${encodeURIComponent(id)}`, { method: 'DELETE', token });

export const uploadProjectMedia = (id, field, file, token) => {
  const form = new FormData();
  form.append(field, file);
  return api(`/api/admin/projects/${encodeURIComponent(id)}/${field}`, {
    method: 'POST',
    form,
    token,
  }).then((data) => data.project);
};
