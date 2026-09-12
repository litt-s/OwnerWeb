import { api } from '../api';

export const fetchPublicProjects = (token) =>
  api('/api/projects', { token }).then((data) => data.projects || []);

export const fetchPublicProject = (id, token) =>
  api(`/api/projects/${encodeURIComponent(id)}`, { token }).then((data) => data.project);

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

export const signProjectVideo = (id, payload, token) =>
  api(`/api/admin/projects/${encodeURIComponent(id)}/video/sign`, {
    method: 'POST',
    body: payload,
    token,
  });

export const uploadProjectMedia = (id, field, file, token) => {
  const form = new FormData();
  form.append(field, file);
  return api(`/api/admin/projects/${encodeURIComponent(id)}/${field}`, {
    method: 'POST',
    form,
    token,
  }).then((data) => data.project);
};

// 上传封面（带进度）：fetch 拿不到上传进度，用 XHR
export const uploadProjectCover = (id, file, token, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${import.meta.env.VITE_API_BASE || ''}/api/admin/projects/${encodeURIComponent(id)}/cover`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* 忽略非 JSON 响应 */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data.project);
      else reject(new Error(data.error || '请求失败'));
    };
    xhr.onerror = () => reject(new Error('请求失败'));
    const form = new FormData();
    form.append('cover', file);
    xhr.send(form);
  });
