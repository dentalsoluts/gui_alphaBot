import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env.js';
import authRoutes from '../src/routes/auth.rotes.js';
import tradingRoutes from './routes/trading.routes.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/trading', tradingRoutes);

export default app;
