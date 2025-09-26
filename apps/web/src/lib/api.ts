/**
 * API utility functions for the F1 frontend application
 */

/**
 * Get the API base URL from environment variables or default to relative paths
 */
export const getApiUrl = (endpoint: string): string => {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  // If we have an API base URL configured, use it
  if (apiBase) {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${apiBase}/api/v1/${cleanEndpoint}`;
  }

  // Fallback to relative paths (for backward compatibility)
  return endpoint;
};

/**
 * Fetch wrapper with error handling and API URL resolution
 */
export const apiFetch = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const url = getApiUrl(endpoint);

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response;
};

/**
 * Convenience method for GET requests
 */
export const apiGet = async (endpoint: string): Promise<any> => {
  const response = await apiFetch(endpoint);
  return response.json();
};

/**
 * Convenience method for POST requests
 */
export const apiPost = async (endpoint: string, data?: any): Promise<any> => {
  const response = await apiFetch(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
};