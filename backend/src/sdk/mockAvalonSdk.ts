// backend/src/sdk/mockAvalonSdk.ts

// Tipos auxiliares
export type AccountType = 'demo' | 'real';

export type PositionStatus = 'open' | 'closed';

export interface UserData {
  email: string;
  name: string;
  accountType: AccountType;
}

export interface BalanceInfo {
  demo: number;
  real: number;
  currency: string;
}

export interface Position {
  id: number;
  externalId: string;
  type: 'CALL' | 'PUT';
  amount: number;
  openTime: Date;
  pnlNet: number;
  status: PositionStatus;
}

export interface MarketData {
  symbol: string;
  price: number;
  timestamp: number; // ms
  bid: number;
  ask: number;
}

export interface Candle {
  time: number;   // unix em segundos (IMPORTANTE: usado pelo wrapper/socket)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class MockAvalonSdk {
  private _isConnected = false;
  private _userData: UserData | null = null;
  private _balance = 10_950.0;
  private _positions: Position[] = [];

  get isConnected() {
    return this._isConnected;
  }

  get userData() {
    return this._userData;
  }

  async connect(email: string, password: string): Promise<{ success: boolean; message: string }> {
    // Simula delay de conexão
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Credenciais de demonstração (ajuste se quiser)
    if (email === 'bxconsultoria@gmail.com' && password === '212646@Wagner') {
      this._isConnected = true;
      this._userData = {
        email,
        name: 'Samuel Martins',
        accountType: 'demo',
      };

      return {
        success: true,
        message: 'Conectado com sucesso (modo demonstração)',
      };
    }

    return {
      success: false,
      message: 'Credenciais inválidas',
    };
  }

  disconnect(): void {
    this._isConnected = false;
    this._userData = null;
    this._positions = [];
  }

  async getBalance(): Promise<BalanceInfo> {
    this.ensureConnected();
    return {
      demo: this._balance,
      real: 0,
      currency: 'BRL',
    };
  }

  async getPositions(): Promise<Position[]> {
    this.ensureConnected();
    return this._positions;
  }

  async buyBlitzOption(type: 'call' | 'put', amount: number): Promise<{ success: true; positionId: number }> {
    this.ensureConnected();

    const position: Position = {
      id: Date.now(),
      externalId: `DEMO_${Date.now()}`,
      type: type.toUpperCase() === 'CALL' ? 'CALL' : 'PUT',
      amount,
      openTime: new Date(),
      pnlNet: 0,
      status: 'open',
    };

    this._positions.push(position);
    this._balance -= amount;

    // Simula resultado (10s)
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      const isWin = Math.random() > 0.4; // 60% win
      position.pnlNet = isWin ? amount * 0.8 : -amount;
      position.status = 'closed';

      if (isWin) {
        this._balance += amount + position.pnlNet;
      }
      clearTimeout(timer);
    }, 10_000);

    return { success: true, positionId: position.id };
  }

  async resetDemoBalance(): Promise<boolean> {
    this.ensureConnected();
    this._balance = 10_000.0;
    this._positions = [];
    return true;
  }

  // -------- Market / Candles (mock) --------

  async getMarketData(symbol = 'EURUSD'): Promise<MarketData> {
    const basePrice = 1.0850;
    const variation = (Math.random() - 0.5) * 0.01;
    const price = basePrice + variation;

    return {
      symbol,
      price,
      timestamp: Date.now(), // ms
      bid: price - 0.0001,
      ask: price + 0.0001,
    };
  }

  /**
   * Gera candles sintéticos.
   * time em **segundos** para combinar com o wrapper/socket.
   */
  async getCandleData(symbol = 'EURUSD', timeframe: '1m' | '5m' | '15m' | '1h' = '1m', count = 100): Promise<Candle[]> {
    const candles: Candle[] = [];
    const basePrice = 1.0850;
    let currentPrice = basePrice;

    const stepSeconds = (() => {
      switch (timeframe) {
        case '5m': return 300;
        case '15m': return 900;
        case '1h': return 3600;
        case '1m':
        default: return 60;
      }
    })();

    const nowSec = Math.floor(Date.now() / 1000);

    for (let i = count; i > 0; i--) {
      const time = nowSec - i * stepSeconds; // segundos
      const variation = (Math.random() - 0.5) * 0.005;

      const open = currentPrice;
      const close = open + variation;
      const high = Math.max(open, close) + Math.random() * 0.002;
      const low = Math.min(open, close) - Math.random() * 0.002;

      candles.push({
        time,
        open: parseFloat(open.toFixed(5)),
        high: parseFloat(high.toFixed(5)),
        low: parseFloat(low.toFixed(5)),
        close: parseFloat(close.toFixed(5)),
        volume: Math.floor(Math.random() * 1000) + 100,
      });

      currentPrice = close;
    }

    return candles;
  }

  // Util
  private ensureConnected(): void {
    if (!this._isConnected) {
      throw new Error('Não conectado');
    }
  }
}

const instance = new MockAvalonSdk();
export default instance;
