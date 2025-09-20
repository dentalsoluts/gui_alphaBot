import { ENV } from '../config/env.js';
import mockSdk from './mockAvalonSdk.js';

import type {
  ClientSdk,
  BalanceType as BalanceTypeEnum,
  BlitzOptionsDirection as BlitzDirEnum,
  LoginPasswordAuthMethod
} from '@quadcode-tech/client-sdk-js';

export type Candle = {
  time: number;            // unix (segundos)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export interface ChartLayer {
  fetchAllCandles(fromUnix: number): Promise<Candle[]>;
  subscribeOnLastCandleChanged(cb: (candle: Candle) => void): () => void; // sempre retorna unsubscribe
  getAllCandles?(): Candle[];
  dispose?(): void;
  subscribeOnConsistencyRecovered?(cb: () => void): () => void;
}

const sdkImport = () => import('@quadcode-tech/client-sdk-js');

function symbolFromActiveId(activeId: number){
    if (activeId === 1) return 'EURUSD'
    if (activeId === 2) return 'GBPUSD'
    return 'EURUSD'
}

function timeFrameFromSeconds(sec: number){
    if(sec === 60) return '1m';
    if(sec === 300) return '5m'
    if(sec === 900) return '15m'
    if(sec === 3600) return '1h'
    return '1m'
}

class AvalonSdkWrapper {
  private sdk: ClientSdk | null = null;
  private isConnected = false;
  private useMock = false;
  private balances: any = null;
  private quotes: any = null;
  private blitzOptions: any = null;
  private positions: any = null;

  get connected() { return this.isConnected; }
  get mockMode() { return this.useMock; }

  async connect(email: string, password: string) {
    if (ENV.FORCE_MOCK) {
      this.useMock = true;
      this.isConnected = true;
      await mockSdk.connect(email, password);
      return { success: true, message: 'Conectado em MOCK (FORCE_MOCK=true)' };
    }

    try {
      const { ClientSdk, LoginPasswordAuthMethod } = await sdkImport();
      const auth = new LoginPasswordAuthMethod(ENV.SDK_API_URL, email, password);

      this.sdk = await ClientSdk.create(
        ENV.SDK_WS_URL,
        ENV.SDK_APP_ID,
        auth,
        { host: ENV.SDK_HOST }
      );

      this.balances = await this.sdk.balances();
      this.quotes = await this.sdk.quotes();
      this.blitzOptions = await this.sdk.blitzOptions();
      this.positions = await this.sdk.positions();

      this.isConnected = true;
      this.useMock = false;
      return { success: true, message: 'Conectado ao SDK real' };
    } catch (err: any) {
      console.warn('Falha no SDK real, usando MOCK:', err?.message);
      this.useMock = true;
      this.isConnected = true;
      await mockSdk.connect(email, password);
      return { success: true, message: 'Conectado em MOCK (fallback)' };
    }
  }

  disconnect() {
    this.sdk = null;
    this.balances = this.quotes = this.blitzOptions = this.positions = null;
    this.isConnected = false;
    this.useMock = false;
  }

  async getBalance() {
    if (!this.isConnected) return null;
    if (this.useMock) return mockSdk.getBalance();

    const { BalanceType } = await sdkImport() as unknown as { BalanceType: typeof BalanceTypeEnum };
    const all = this.balances.getBalances();
    const demo = all.find((b: any) => b.type === BalanceType.Demo);
    const real = all.find((b: any) => b.type === BalanceType.Real);
    return {
      demo: demo?.amount ?? 0,
      real: real?.amount ?? 0,
      current: demo ?? real ?? null
    };
  }

  async getPositions() {
    if (!this.isConnected) return [];
    if (this.useMock) return mockSdk.getPositions();
    return this.positions.getAllPositions();
  }

  async buyBlitzOption(direction: 'call'|'put', amount: number, activeId = 1) {
    if (!this.isConnected) throw new Error('SDK não conectado.');
    if (this.useMock) return mockSdk.buyBlitzOption(direction, amount);

    const { BalanceType, BlitzOptionsDirection } = await sdkImport() as unknown as {
      BalanceType: typeof BalanceTypeEnum,
      BlitzOptionsDirection: typeof BlitzDirEnum
    };

    const now = this.sdk!.currentTime?.() ?? new Date();
    const actives = this.blitzOptions.getActives();
    const active = actives.find((a: any) => a.id === activeId && a.canBeBoughtAt(now));
    if (!active) throw new Error('Ativo indisponível para compra');

    const balance = this.balances.getBalances().find((b: any) => b.type === BalanceType.Demo);
    if (!balance) throw new Error('Saldo demo não encontrado');

    const exp = active.expirationTimes[0];
    return this.blitzOptions.buy(
      active,
      direction === 'call' ? BlitzOptionsDirection.Call : BlitzOptionsDirection.Put,
      exp,
      amount,
      balance
    );
  }

  async resetDemoBalance() {
    if (!this.isConnected) return false;
    if (this.useMock) return mockSdk.resetDemoBalance();

    const { BalanceType } = await sdkImport() as unknown as { BalanceType: typeof BalanceTypeEnum };
    const demo = this.balances.getBalances().find((b: any) => b.type === BalanceType.Demo);
    if (!demo) return false;
    await demo.resetDemoBalance();
    return true;
  }

  async getCurrentQuote(activeId = 1) {
        if (!this.isConnected) return null;
        if (this.useMock) return mockSdk.getMarketData();
        return this.quotes.getCurrentQuoteForActive(activeId);
    }

    // stream de candles (para o socket)
  async createRealtimeChartLayer(activeId: number, candleSizeSec: number): Promise<ChartLayer> {
  if (!this.useMock) {
    const real = await this.sdk!.realTimeChartDataLayer(activeId, candleSizeSec);

    // mapeia candle do SDK -> Candle do wrapper
    const mapCandle = (c: any): Candle => {
      // tenta várias formas comuns: time (s), timestamp (ms), timestamp (s)
      const t =
        typeof c.time === 'number' ? c.time :
        typeof c.timestamp === 'number'
          ? (c.timestamp > 2_000_000_000 ? Math.floor(c.timestamp / 1000) : c.timestamp)
          : Math.floor(Date.now() / 1000);

      return {
        time: t,
        open: Number(c.open ?? 0),
        high: Number(c.high ?? c.open ?? 0),
        low: Number(c.low ?? c.open ?? 0),
        close: Number(c.close ?? c.open ?? 0),
        volume: Number(c.volume ?? 0),
      };
    };

    const layer: ChartLayer = {
      fetchAllCandles: async (fromUnix: number) => {
        const arr = await real.fetchAllCandles(fromUnix);
        return arr.map(mapCandle);
      },
      subscribeOnLastCandleChanged: (cb: (c: Candle) => void) => {
        const handler = (sdkCandle: any) => cb(mapCandle(sdkCandle));
        // SDK pode retornar void; nós devolvemos um unsubscribe no-op
        real.subscribeOnLastCandleChanged(handler);
        return () => { /* no-op; SDK não expõe unsubscribe */ };
      },
      getAllCandles: real.getAllCandles
        ? () => (real.getAllCandles() as any[]).map(mapCandle)
        : undefined,
      subscribeOnConsistencyRecovered: real.subscribeOnConsistencyRecovered
        ? (cb: () => void) => {
            real.subscribeOnConsistencyRecovered!(cb);
            return () => { /* no-op */ };
          }
        : undefined,
      dispose:
        ('dispose' in real)
          ? () => { (real as any).dispose(); }
          : undefined,
    };

    return layer;
  }

  // ---------- MODO MOCK (mantém sua versão atual) ----------
  const symbol = symbolFromActiveId(activeId);
  const timeframe = timeFrameFromSeconds(candleSizeSec);

  let candles: Candle[] = await mockSdk.getCandleData(symbol, timeframe, 100);
  const subscribers = new Set<(c: Candle) => void>();
  let timer: NodeJS.Timeout | null = null;

  function startTimer() {
    timer = setInterval(() => {
      const last = candles[candles.length - 1];
      const lastTime = last?.time ?? Math.floor(Date.now() / 1000);
      const nextTime = lastTime + candleSizeSec;

      const base = last?.close ?? last?.open ?? 1.0;
      const drift = (Math.random() - 0.5) * (base * 0.001);
      const open = base;
      const close = Math.max(0.00001, base + drift);
      const high = Math.max(open, close) + Math.abs(drift) * 0.3;
      const low = Math.min(open, close) - Math.abs(drift) * 0.3;

      const newCandle: Candle = { time: nextTime, open, high, low, close, volume: 1 };
      candles = [...candles.slice(-999), newCandle];
      subscribers.forEach(cb => cb(newCandle));
    }, candleSizeSec * 1000);
  }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; }

  const layer: ChartLayer = {
    fetchAllCandles: async (_fromUnix) => candles,
    subscribeOnLastCandleChanged: (cb) => {
      subscribers.add(cb);
      if (!timer) startTimer();
      return () => { subscribers.delete(cb); if (subscribers.size === 0) stopTimer(); };
    },
    getAllCandles: () => candles,
    dispose: () => { subscribers.clear(); stopTimer(); }
  };

  return layer;
}



}

export default new AvalonSdkWrapper();
