import app from './app.js';
import { env } from './config/env.js';
import { checkDatabaseConnection } from './database/connection.js';

const server = app.listen(env.port, async () => {
  const database = await checkDatabaseConnection();
  console.log(`Albion Market Analyzer API em http://localhost:${env.port}`);
  if (!database.configured) {
    console.log('Banco nao configurado: historico e watchlist estao desativados.');
  } else if (!database.connected) {
    console.warn(`Banco indisponivel: ${database.error}`);
  } else {
    console.log('MySQL/MariaDB conectado.');
  }
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
