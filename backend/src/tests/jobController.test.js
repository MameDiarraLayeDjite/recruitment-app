const request = require('supertest');
const app = require('../app');
const User = require('../models/Job');
const mongoose = require('mongoose');
const { it } = require('zod/v4/locales');

beforeAll(async () => {
  await Job.deleteMany({});
});

describe('Job Controller', () => {

  jest.setTimeout(15000);
  let accessToken;
  let refreshCookie;

  it('should create a new job', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Test Job',
        description: 'This is a test job',
        department: 'Engineering',
        location: 'Remote',
        salaryRange: '50000-70000',
        type: 'CDI',
        requirements: ['JavaScript', 'Node.js'],
        benefits: ['Health Insurance', 'Remote Work'],
        tags: ['test', 'job'],
        visibility: 'public'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('jobId');
  });

  it('should get all jobs', async () => {
    const res = await request(app)
      .get('/api/v1/jobs')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('jobs');
  });
   it ('should get a job by ID', async () => {
    const jobRes = await request (app)
      .post ('/api/v1/jobs')
        .set ('Authorization', `Bearer ${accessToken}`) 
        .send ({
            title: 'Another Test Job',
            description: 'This is another test job',
            department: 'Marketing',
            location: 'Remote',
            salaryRange: '40000-60000',
            type: 'CDD',
            requirements: ['SEO', 'Content Creation'],
            benefits: ['Flexible Hours', 'Gym Membership'],
            tags: ['marketing', 'test'],
            visibility: 'public'
        });
    const jobId = jobRes.body.jobId;

    const res = await request (app)
      .get (`/api/v1/jobs/${jobId}`)
      .set ('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('job');
    expect(res.body.job).toHaveProperty('jobId', jobId);
  });

afterAll(async () => {
  await mongoose.connection.close();
});
});
