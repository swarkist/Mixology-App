import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';

// Mock auth middleware to simulate authentication behavior
vi.mock('../../server/middleware/auth', () => ({
  createAuthMiddleware: () => ({
    requireAuth: (req: any, res: any, next: any) => {
      const auth = req.headers['authorization'];
      if (auth === 'Bearer valid-token') {
        req.user = { id: 1, role: 'admin' };
        next();
      } else {
        res.status(401).json({ message: 'Authentication required' });
      }
    },
    requireAdmin: (_req: any, _res: any, next: any) => next()
  })
}));

vi.mock('../../server/middleware/roles', () => ({
  allowRoles: (...roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (req.user && roles.includes(req.user.role)) {
        return next();
      }
      res.status(403).json({ message: 'Forbidden' });
    };
  },
  rejectWritesForReviewer: (_req: any, _res: any, next: any) => next()
}));

describe('GET /api/users/:id', () => {
  let server: any;
  let port: number;
  const storage = {
    getUserById: vi.fn().mockResolvedValue({ id: 1, email: 'test@example.com' })
  } as any;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    const { registerRoutes } = await import('../../server/routes');
    server = await registerRoutes(app as any, storage);
    await new Promise(resolve => server.listen(0, resolve));
    const address: any = server.address();
    port = typeof address === 'object' ? address.port : address;
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
  });

  it('allows authenticated admin to view user data', async () => {
    const res = await fetch(`http://localhost:${port}/api/users/1`, {
      headers: { Authorization: 'Bearer valid-token' }
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ id: 1, email: 'test@example.com' });
    expect(storage.getUserById).toHaveBeenCalledWith(1);
  });

  it('rejects anonymous requests with 401', async () => {
    const res = await fetch(`http://localhost:${port}/api/users/1`);
    expect(res.status).toBe(401);
    expect(storage.getUserById).toHaveBeenCalledTimes(1); // only from authenticated call
  });
});

