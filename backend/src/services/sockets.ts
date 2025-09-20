import type { Server } from 'socket.io';
import sdk from '../sdk/avanlonSdkWrapper';

export function initSockets(io: Server) {
  // nsp = namespace 
  const nsp = io.of('/chart');

  nsp.on('connection', (socket) => {
    socket.on('subscribe:candles', async ({ activeId = 1, candleSize = 60 }) => {
      try {
        const layer = await sdk.createRealtimeChartLayer(Number(activeId), Number(candleSize));
        const from = Math.floor(Date.now() / 1000) - 60 * 60; // 60min atrás
        const candles = await layer.fetchAllCandles(from);
        socket.emit('candles:init', candles);

        const offLast = layer.subscribeOnLastCandleChanged((candle: any) => {
          socket.emit('candles:update', candle);
        });

        const offRecover = layer.subscribeOnConsistencyRecovered?.(() => {
          const all = layer.getAllCandles?.();
          if (all) socket.emit('candles:resync', all);
        });

        socket.on('disconnect', () => {
          offLast?.();
          offRecover?.();
        });
      } catch (e: any) {
        socket.emit('candles:error', e?.message ?? 'erro ao iniciar stream');
      }
    });
  });
}
