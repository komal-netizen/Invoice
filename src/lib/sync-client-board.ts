/**
 * Helper to sync client board data to server-side store for public access.
 * Call this when generating/updating a board token to ensure the public API has fresh data.
 */
import type { ClientBoardSnapshot } from "./client-board-store";

export async function syncClientBoardToServer(token: string, data: ClientBoardSnapshot): Promise<boolean> {
  try {
    const response = await fetch('/api/client-board/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, data }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to sync client board:', error);
    return false;
  }
}
