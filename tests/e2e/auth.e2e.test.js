import { jest } from '@jest/globals';
import request from 'supertest';

// We need to test the app, but it requires a database.
// For E2E tests without DB, we test that routes respond correctly.
// These tests verify HTTP behavior, not DB integration.

let app;

beforeAll(async () => {
    // Dynamically import to handle ESM
    const module = await import('../../app.js');
    app = module.default;
});

describe('Authentication Routes', () => {
    describe('GET /login', () => {
        it('should render login page', async () => {
            const response = await request(app).get('/login');
            expect(response.status).toBe(200);
            expect(response.text).toContain('sign in');
        });
    });

    describe('GET /logout', () => {
        it('should redirect to login page', async () => {
            const response = await request(app).get('/logout');
            expect(response.status).toBe(302);
            expect(response.headers.location).toBe('/login');
        });
    });

    describe('GET / (protected route)', () => {
        it('should redirect unauthenticated user to login', async () => {
            const response = await request(app).get('/');
            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/login');
        });
    });

    describe('Security Headers', () => {
        it('should include helmet security headers', async () => {
            const response = await request(app).get('/login');
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
        });
    });
});
