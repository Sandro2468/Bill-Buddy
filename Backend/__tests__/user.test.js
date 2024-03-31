const request = require('supertest');
const app = require('../app'); // Sesuaikan dengan path menuju app.js

describe('User Endpoints', () => {
  let authToken;

  // Test register endpoint
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/register')
      .send({ email: 'sandro@mail.com', password: 'sandro123' });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Success create user');
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data).toHaveProperty('email', 'sandro@mail.com');
  });
  // Test login endpoint
  it('should login with registered user', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'hesty11@mail.com', password: 'hesty11' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Login success');
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data).toHaveProperty('email', 'hesty11@mail.com');
    expect(res.body.data).toHaveProperty('access_token');
    authToken = res.body.data.access_token; // Simpan token untuk digunakan pada endpoint lain
  });
  // Test logout endpoint
  it('should logout the user', async () => {
    const res = await request(app)
      .get('/logout')
      .set('Authorization', `Bearer ${authToken}`); 

    expect(res.statusCode).toEqual(302); 
    expect(res.header['set-cookie']).toBeDefined(); 
  });
});
