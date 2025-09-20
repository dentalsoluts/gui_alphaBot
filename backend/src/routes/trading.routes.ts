import { Router } from 'express';
import sdk from '../sdk/avanlonSdkWrapper.js';
import { ensureAuth } from '../middleware/auth.js';

const router = Router();
router.use(ensureAuth);

router.get('/balance', async (_req, res) => {
  const data = await sdk.getBalance();
  res.json(data);
});

router.get('/positions', async (_req, res) => {
  const data = await sdk.getPositions();
  res.json(data);
});

router.post('/buy', async (req, res) => {
  const { direction, amount, activeId = 1 } = req.body ?? {};
  if (!direction || !amount) return res.status(400).json({ error: 'direction/amount obrigatórios' });
  try {
    const option = await sdk.buyBlitzOption(direction, Number(amount), Number(activeId));
    res.json(option);
  } catch (e: any) {
    res.status(400).json({ error: e?.message ?? 'falha na compra' });
  }
});

router.post('/reset-demo', async (_req, res) => {
  const ok = await sdk.resetDemoBalance();
  res.json({ ok });
});

export default router;
