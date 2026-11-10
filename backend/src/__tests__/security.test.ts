import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('GÜVEN MODE - Security Hardening Verification', () => {
  it('blocks unauthenticated access to admin dashboard', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('rejects old hardcoded admin backdoor header x-admin-key', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('x-admin-key', 'guven-admin-2026');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('rejects unauthenticated checkout attempts (login required)', async () => {
    const res = await request(app)
      .post('/api/checkout')
      .send({
        customerName: 'Attacker',
        customerPhone: '12345678',
        shippingAddress: {
          recipientName: 'Attacker',
          phone: '12345678',
          region: 'Tunis',
          city: 'Tunis',
          streetAddress: 'Rue Test'
        },
        items: [{ variantId: '123', quantity: 1 }]
      });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('blocks unauthenticated order reference lookup to protect customer PII', async () => {
    const res = await request(app).get('/api/orders/GM-2026-0001');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('blocks unauthenticated /api/auth/me', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects requests from unauthorized CORS origins', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://evil-phishing-site.com');
    expect(res.status).toBe(403);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows requests from authorized production frontend origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://guvenmode-frontend.onrender.com');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://guvenmode-frontend.onrender.com');
  });

  it('enforces strong password policy on registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: '123', firstName: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
