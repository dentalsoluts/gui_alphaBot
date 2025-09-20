import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app';
import { ENV } from './src/config/env';
import { initSockets } from './src/services/sockets';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: ENV.CORS_ORIGIN }
});

initSockets(io);

httpServer.listen(ENV.PORT, () => {
  console.log(`API on http://localhost:${ENV.PORT}`);
});
