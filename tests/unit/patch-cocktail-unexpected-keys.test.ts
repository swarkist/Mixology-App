import { describe, it, expect, vi } from 'vitest';
import express from 'express';

vi.mock('../../server/middleware/auth', () => ({
  createAuthMiddleware: () => ({
    requireAuth: (req: any, _res: any, next: any) => {
      req.user = { id: 1, role: 'admin' };
      next();
    },
    requireAdmin: (req: any, _res: any, next: any) => {
      req.user = { id: 1, role: 'admin' };
      next();
    }
  })
}));

vi.mock('../../server/middleware/roles', () => ({
  allowRoles: () => (_req: any, _res: any, next: any) => next(),
  rejectWritesForReviewer: (_req: any, _res: any, next: any) => next()
}));

describe('PATCH /api/cocktails/:id', () => {
  it('ignores unexpected keys in request body', async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.REFRESH_SECRET = 'test-refresh';

    const { registerRoutes } = await import('../../server/routes');

    const app = express();
    app.use(express.json());

    const storage = {
      getCocktail: vi.fn().mockResolvedValue({ id: 1 }),
      updateCocktail: vi.fn().mockResolvedValue({ id: 1 })
    } as any;

    const server = await registerRoutes(app as any, storage);
    await new Promise(resolve => server.listen(0, resolve));
    const address: any = server.address();
    const port = typeof address === 'object' ? address.port : address;

    const res = await fetch(`http://localhost:${port}/api/cocktails/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated', unexpected: 'value' })
    });
    await res.json();

    expect(storage.updateCocktail).toHaveBeenCalledWith(1, { name: 'Updated' });

    await new Promise(resolve => server.close(resolve));
  });
});
