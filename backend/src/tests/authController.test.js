const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const mongoose = require('mongoose');

beforeAll(async () => {
  await User.deleteMany({});
});

describe('Auth Controller', () => {
  jest.setTimeout(15000); 
  let accessToken;
  let refreshCookie;

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        role: 'applicant'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('userId');
  });

  it('should log in an existing user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();

    accessToken = res.body.accessToken;
    // Store the refresh token cookie for next tests
    refreshCookie = res.headers['set-cookie'].find(cookie =>
      cookie.startsWith('refreshToken='),
    );
  });

  it('should refresh the access token using refresh token cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('should log out the user and clear the cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
    // Verify cookie was cleared
    expect(
      res.headers['set-cookie'].some(c => c.includes('refreshToken=;')),
    ).toBe(true);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
