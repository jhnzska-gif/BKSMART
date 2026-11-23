import type { IncomingMessage, ServerResponse } from 'http';
import { createApiApp } from './app.ts';

const app = createApiApp();

export default function handler(
  req: IncomingMessage & { url?: string },
  res: ServerResponse
) {
  if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      const apiPath = parsed.searchParams.get('__api_path');
      if (apiPath !== null) {
        parsed.searchParams.delete('__api_path');
        const qs = parsed.searchParams.toString();
        const normalized = apiPath.replace(/^\/+/, '');
        req.url = `/api/${normalized}${qs ? `?${qs}` : ''}`;
      } else if (!req.url.startsWith('/api')) {
        req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
      }
    } catch {
      // Preserve req.url if URL parsing fails
    }
  }
  return app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}
