import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiApp } from './server/app.ts';
import { ensureNeonReady, isNeonConfigured } from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePort(): number {
  const portFlagIndex = process.argv.indexOf('--port');
  if (portFlagIndex !== -1 && process.argv[portFlagIndex + 1]) {
    const parsed = Number(process.argv[portFlagIndex + 1]);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return Number(process.env.PORT) || 3000;
}

async function startServer() {
  const app = createApiApp();
  const PORT = resolvePort();

  // Vite middleware in development (initialized asynchronously so port 3000 binds immediately),
  // static dist in production
  if (process.env.NODE_ENV !== 'production') {
    let viteMiddleware: express.RequestHandler | null = null;
    const viteReadyPromise = import('vite')
      .then(({ createServer: createViteServer }) =>
        createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        })
      )
      .then((vite) => {
        viteMiddleware = vite.middlewares as unknown as express.RequestHandler;
        console.log('Vite dev middleware ready.');
      })
      .catch((err) => {
        console.error('Failed to initialize Vite dev middleware:', err);
        throw err;
      });

    app.use(async (req, res, next) => {
      try {
        if (!viteMiddleware) {
          await viteReadyPromise;
        }
        if (viteMiddleware) {
          return viteMiddleware(req, res, next);
        }
        next();
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `BKSmart server running on http://0.0.0.0:${PORT} (DB: ${
        isNeonConfigured() ? 'NeonDB PostgreSQL' : 'Memory Fallback - set DATABASE_URL for NeonDB'
      })`
    );
    if (isNeonConfigured()) {
      ensureNeonReady()
        .then(() => console.log('NeonDB schema and initial seed verified.'))
        .catch((err) => console.error('NeonDB auto-init error on startup:', err));
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start BKSmart server:', err);
  process.exit(1);
});
