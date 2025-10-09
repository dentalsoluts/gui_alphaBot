// Serviço simples para gerar decisões aleatórias do bot
class TechnicalAnalysis {
  constructor() {
    // Seed mais complexo para maior aleatoriedade
    this.seed = Math.random() * 1000000
  }

  // Gera decisão aleatória simples para cada vela
  getRandomDecision(candle) {
    // Usa múltiplos fatores para maior aleatoriedade
    const timestamp = candle.timeMs
    const price = candle.close
    const volume = candle.volume || 1
    
    // Combina timestamp, preço, volume e seed para maior aleatoriedade
    const combined = (timestamp * 0.001 + price * 1000 + volume + this.seed) % 1
    
    // 50% compra, 50% venda (sem opção neutra)
    return combined < 0.5 ? 'buy' : 'sell'
  }

  // Gera sinais para um array de candles
  generateSignals(candles) {
    return candles.map(candle => ({
      candle,
      signal: this.getRandomDecision(candle),
      timestamp: candle.timeMs
    }))
  }
}

export default new TechnicalAnalysis()
