const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('Server API', () => {
    // We mock mongoose connect to avoid real DB connection for this smoke test
    beforeAll(() => {
        jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve());
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/api/unknown-route-123');
        expect(res.statusCode).toEqual(404);
    });

    it('should have security headers', async () => {
        const res = await request(app).get('/api/unknown-route-123');
        expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    });
});
