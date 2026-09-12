const BASE = import.meta.env.VITE_API_BASE || '';

export async function api(path, { method = 'GET', body, form, token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form !== undefined) {
    // FormData：不要手动设置 Content-Type，浏览器会自动补 multipart boundary
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}
