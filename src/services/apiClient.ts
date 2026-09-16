export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers
      },
      signal: init.signal || controller.signal
    });
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      const detail = typeof payload === 'object' && payload !== null && 'detail' in payload ? payload.detail : payload;
      throw new ApiError(`Backend request failed (${response.status})`, response.status, detail);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Backend request timed out', 408);
    }
    throw new ApiError('Backend unavailable', 0, error);
  } finally {
    window.clearTimeout(timeout);
  }
}

export const apiClient = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) => request<T>(path, {
    ...init,
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body)
  }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) => request<T>(path, {
    ...init,
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body)
  }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) => request<T>(path, {
    ...init,
    method: 'PATCH',
    body: body === undefined ? undefined : JSON.stringify(body)
  }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'DELETE' }),
  health: () => request<{ status: string; service: string }>('/v1/health')
};
