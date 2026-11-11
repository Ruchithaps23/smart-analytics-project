export const API_BASE_URL = "http://127.0.0.1:8001";

export async function fetchEndpoint(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) throw new Error(`${endpoint} returned ${response.status}`);
  return response.json();
}
