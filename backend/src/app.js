import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { checkDatabaseConnection } from './database/connection.js';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import userRoutes from './routes/userRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';

export const createApp = () => {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.frontendUrl }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', async (_request, response) => {
    const database = await checkDatabaseConnection();
    response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        configured: database.configured,
        connected: database.connected,
      },
    });
  });
  app.use('/api/auth', authRoutes);
  app.use('/api/market', marketRoutes);
  app.use('/api/items', itemRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/watchlist', watchlistRoutes);

  app.use((request, response) => {
    response.status(404).json({ error: { message: `Rota nao encontrada: ${request.method} ${request.path}` } });
  });

  app.use((error, _request, response, _next) => {
    const statusCode = error.statusCode || 500;
    if (statusCode >= 500 && env.nodeEnv !== 'test') console.error(error);
    response.status(statusCode).json({
      error: {
        message: statusCode >= 500 && !error.statusCode ? 'Erro interno do servidor.' : error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
  });

  return app;
};

export default createApp();
