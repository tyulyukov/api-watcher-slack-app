export async function fetchApiSpec(url: string): Promise<object> {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'api-watcher/1.0.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Invalid content type for ${url}: ${contentType}`);
  }

  return await response.json() as object;
} 