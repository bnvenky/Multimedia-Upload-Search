import { API_URL } from './config';

/**
 * Uploads one file with XMLHttpRequest because, unlike fetch, it reports upload progress.
 * Resolves with the created file; rejects with { status, code, message }.
 */
export const uploadRequest = ({ file, metadata, accessToken, onProgress, signal }) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/files`);
    xhr.withCredentials = true;
    if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      let body = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON response, e.g. a proxy error page.
      }

      if (xhr.status >= 200 && xhr.status < 300 && body?.data?.file) {
        resolve(body.data.file);
      } else {
        reject({ status: xhr.status, code: body?.error?.code, message: body?.error?.message ?? `Upload failed (HTTP ${xhr.status})` });
      }
    };

    xhr.onerror = () => reject({ status: 0, code: 'NETWORK_ERROR', message: 'Network error — check your connection and retry.' });
    xhr.onabort = () => reject({ status: 0, code: 'ABORTED', message: 'Upload canceled' });
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });

    // Text fields first, the file last.
    const form = new FormData();
    if (metadata.title) form.append('title', metadata.title);
    if (metadata.description) form.append('description', metadata.description);
    if (metadata.tags?.length) form.append('tags', metadata.tags.join(','));
    form.append('visibility', metadata.visibility ?? 'public');
    form.append('file', file);

    xhr.send(form);
  });
