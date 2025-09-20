import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import sdk from '../sdk/avanlonSdkWrapper.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'email/senha obrigatórios' });

  const result = await sdk.connect(email, password);
  const token = jwt.sign({ email }, ENV.JWT_SECRET, { expiresIn: '8h' });
  res.json({ ...result, mock: sdk.mockMode, token });
});

router.post('/logout', (_req, res) => {
  sdk.disconnect();
  res.json({ ok: true });
});

export default router;
