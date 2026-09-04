export async function apiFetch(resource: string | Request, config: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token');
  const activeAccountId = localStorage.getItem('currentProfileId') || localStorage.getItem('activeAccountId') || 'default';
  
  const headers = {
    ...(config.headers || {}),
    'X-Account-Id': activeAccountId,
  } as Record<string, string>;
  
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(resource, {
    ...config,
    headers
  });
}
