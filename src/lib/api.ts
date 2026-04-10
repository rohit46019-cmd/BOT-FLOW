
export async function apiFetch(resource: string | Request, config: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token');
  const activeAccountId = localStorage.getItem('activeAccountId');
  
  const headers = {
    ...(config.headers || {}),
  } as Record<string, string>;
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (activeAccountId) {
    headers['X-Account-Id'] = activeAccountId;
  }
  
  return fetch(resource, {
    ...config,
    headers
  });
}
