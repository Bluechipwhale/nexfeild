import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import routes from '../../routes/index.js';

test('NexFieldForce public registration creates a usable staff login', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/auth`;
  const email = `new-staff-${Date.now()}@example.test`;
  const password = 'NexFieldTestPassword2026!';
  try {
    const register = await fetch(`${base}/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Nex Field Staff', email, password, roleCode: 'EMPLOYEE' })
    });
    const created = await register.json();
    assert.equal(register.status, 201, JSON.stringify(created));
    assert.ok(created.token);
    const login = await fetch(`${base}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const signedIn = await login.json();
    assert.equal(login.status, 200, JSON.stringify(signedIn));
    assert.ok(signedIn.token);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
