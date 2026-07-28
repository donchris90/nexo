// Base URL for the backend API (server.ts).
//
// In local web development, this stays empty and requests go to the same
// origin the frontend is served from (Vite proxies /api during `npm run dev`,
// or server.ts serves both the API and the built frontend together in prod).
//
// In the packaged Android/iOS app, there is no backend running inside the
// app itself — set VITE_API_BASE_URL at build time to your deployed
// server.ts URL (e.g. a Render web service) so API calls reach it instead.
//
// Set this in a `.env` file before running `npm run build`:
//   VITE_API_BASE_URL=https://your-app.onrender.com
export const API_BASE_URL: string = (import.meta as any).env?.VITE_API_BASE_URL || '';

/**
 * Wrapper around fetch() that automatically targets the deployed backend
 * when API_BASE_URL is set, and falls back to relative paths otherwise.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  return fetch(url, init);
}
