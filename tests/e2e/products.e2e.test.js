import request from 'supertest';

let app;

beforeAll(async () => {
    const module = await import('../../app.js');
    app = module.default;
});

describe('Product Routes (unauthenticated)', () => {
    describe('GET /products/search', () => {
        it('should redirect unauthenticated user', async () => {
            const response = await request(app).get('/products/search?q=test');
            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/login');
        });
    });

    describe('GET /products/detail', () => {
        it('should redirect unauthenticated user', async () => {
            const response = await request(app).get('/products/detail?id=1');
            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/login');
        });
    });

    describe('POST /products/buy', () => {
        it('should redirect unauthenticated user', async () => {
            const response = await request(app).post('/products/buy');
            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/login');
        });
    });
});

describe('Health Check', () => {
    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app).get('/health');
            // May be 200 (DB connected) or 503 (DB not connected in test)
            expect([200, 503]).toContain(response.status);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('uptime');
        });
    });
});
