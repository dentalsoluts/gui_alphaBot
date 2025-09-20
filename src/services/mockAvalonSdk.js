// Mock do SDK da Avalon para demonstração
class MockAvalonSdk {
  constructor() {
    this.isConnected = false
    this.userData = null
    this.balance = 10950.00
    this.positions = []
  }

  async connect(email, password) {
    // Simular delay de conexão
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Validar credenciais básicas
    if (email === 'bxconsultoria@gmail.com' && password === '212646@Wagner') {
      this.isConnected = true
      this.userData = {
        email,
        name: 'Samuel Martins',
        accountType: 'demo'
      }
      
      return {
        success: true,
        message: 'Conectado com sucesso (modo demonstração)'
      }
    } else {
      return {
        success: false,
        message: 'Credenciais inválidas'
      }
    }
  }

  disconnect() {
    this.isConnected = false
    this.userData = null
    this.positions = []
  }

  async getBalance() {
    if (!this.isConnected) {
      throw new Error('Não conectado')
    }
    
    return {
      demo: this.balance,
      real: 0,
      currency: 'BRL'
    }
  }

  async getPositions() {
    if (!this.isConnected) {
      throw new Error('Não conectado')
    }
    
    return this.positions
  }

  async buyBlitzOption(type, amount) {
    if (!this.isConnected) {
      throw new Error('Não conectado')
    }
    
    // Simular compra
    const position = {
      id: Date.now(),
      externalId: `DEMO_${Date.now()}`,
      type: type.toUpperCase(),
      amount,
      openTime: new Date(),
      pnlNet: 0,
      status: 'open'
    }
    
    this.positions.push(position)
    this.balance -= amount
    
    // Simular resultado após 1 minuto (para demonstração, será mais rápido)
    setTimeout(() => {
      const isWin = Math.random() > 0.4 // 60% chance de ganhar
      position.pnlNet = isWin ? amount * 0.8 : -amount
      position.status = 'closed'
      
      if (isWin) {
        this.balance += amount + position.pnlNet
      }
    }, 10000) // 10 segundos para demonstração
    
    return {
      success: true,
      positionId: position.id
    }
  }

  async resetDemoBalance() {
    if (!this.isConnected) {
      throw new Error('Não conectado')
    }
    
    this.balance = 10000.00
    this.positions = []
    return true
  }

  // Métodos para obter dados de mercado simulados
  async getMarketData(symbol = 'EURUSD') {
    const basePrice = 1.0850
    const variation = (Math.random() - 0.5) * 0.01
    
    return {
      symbol,
      price: basePrice + variation,
      timestamp: Date.now(),
      bid: basePrice + variation - 0.0001,
      ask: basePrice + variation + 0.0001
    }
  }

  // Simular dados de candles
  async getCandleData(symbol = 'EURUSD', timeframe = '1m', count = 100) {
    const candles = []
    const basePrice = 1.0850
    let currentPrice = basePrice
    
    for (let i = count; i > 0; i--) {
      const time = Date.now() - (i * 60000) // 1 minuto por candle
      const variation = (Math.random() - 0.5) * 0.005
      
      const open = currentPrice
      const close = open + variation
      const high = Math.max(open, close) + Math.random() * 0.002
      const low = Math.min(open, close) - Math.random() * 0.002
      
      candles.push({
        time,
        open: parseFloat(open.toFixed(5)),
        high: parseFloat(high.toFixed(5)),
        low: parseFloat(low.toFixed(5)),
        close: parseFloat(close.toFixed(5)),
        volume: Math.floor(Math.random() * 1000) + 100
      })
      
      currentPrice = close
    }
    
    return candles
  }
}

export default new MockAvalonSdk()

