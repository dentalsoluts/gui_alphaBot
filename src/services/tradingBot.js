// TradingBot.js
import avalonSdk from './avalonSdk.js'

const ARROW_PADDING = 0.0004

class TradingBot {
  constructor() {
    this.isRunning = false
    this.strategy = 'Agressivo'
    this.entryValue = 10
    this.target = 100
    this.stopLoss = 50
    this.currentProfit = 0
    this.totalTrades = 0
    this.winTrades = 0
    this.lossTrades = 0
    this.intervalId = null
    this.onUpdate = null

    // providers/callbacks
    this.marketStateProvider = null
    this.onMarker = null
    this.onTrade = null 
    this.activeMarkers = new Set()
    this.pendingTrades = []
  }

  setMarketStateProvider(fn) {
    // { timeMs, high, low, durationMs? }
    this.marketStateProvider = fn
  }

  setMarkerCallback(callback) {
    this.onMarker = callback
  }

  // 👇 NOVO
  setTradeCallback(callback) {
    this.onTrade = callback
  }

  setParameters(strategy, entryValue, target, stopLoss) {
    this.strategy = strategy
    this.entryValue = entryValue
    this.target = target
    this.stopLoss = stopLoss
  }

  setUpdateCallback(callback) {
    this.onUpdate = callback
  }

  async start() {
    if (this.isRunning) return false
    this.isRunning = true
    this.currentProfit = 0
    this.totalTrades = 0
    this.winTrades = 0
    this.lossTrades = 0

    this.log('Bot iniciado com estratégia: ' + this.strategy)
    this.updateStats()

    this.intervalId = setInterval(() => this.executeTrade(), 15000)
    setTimeout(() => this.executeTrade(), 3000)
    return true
  }

  stop() {
    if (!this.isRunning) return false
    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    
    this.pendingTrades = []
    this.log('Bot parado - fila de trades limpa')
    this.updateStats()
    return true
  }

  _getMarkerPosition(side) {
    if (typeof this.marketStateProvider === 'function') {
      const state = this.marketStateProvider() || {}
      const { high, low, durationMs } = state
      const t = state.timeMs ?? state.time
      const baseTs = typeof t === 'number' ? t : (typeof t === 'string' ? Date.parse(t) : NaN)
      
      if (!Number.isNaN(baseTs) && high != null && low != null) {
        const candleDuration = typeof durationMs === 'number' ? durationMs : 60000
        const x = baseTs + (candleDuration / 2)
        
        let y
        if (side === 'buy') {
          y = high - (high - low) * 0.2
        } else {
          y = low + (high - low) * 0.2
        }
        
        return { x, y }
      }
    }
    
    const now = Date.now()
    const x = now
    const base = 1.25
    const y = side === 'buy' ? base + 0.005 : base - 0.005
    return { x, y }
  }

  async executeTrade() {
    if (!this.isRunning) return
    try {
      if (this.currentProfit <= -this.stopLoss) { this.log(`Stop loss atingido: R$ ${this.currentProfit.toFixed(2)}`); this.stop(); return }
      if (this.currentProfit >= this.target)   { this.log(`Meta atingida: R$ ${this.currentProfit.toFixed(2)}`); this.stop(); return }

      let winChance = 0.5
      switch (this.strategy) {
        case 'Conservador': winChance = 0.65; break
        case 'Moderado':    winChance = 0.60; break
        case 'Agressivo':   winChance = 0.55; break
      }

      const direction = this.totalTrades % 2 === 0 ? 'call' : 'put'
      
      if (this.activeMarkers.size > 0) {
        const tradeData = {
          direction,
          winChance,
          timestamp: Date.now()
        }
        this.pendingTrades.push(tradeData)
        this.log(`📋 Trade adicionado à fila: ${direction.toUpperCase()} (${this.pendingTrades.length} na fila)`)
        return
      }

      await this._executeTradeNow(direction, winChance)

      this._processNextTrade()

      this.updateStats()
    } catch (error) {
      this.log(`Erro na execução do trade: ${error.message}`)
    }
  }

  async _executeTradeNow(direction, winChance) {
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.log(`Executando trade ${this.totalTrades + 1}: ${direction.toUpperCase()} - R$ ${this.entryValue}`)

    if (typeof this.onMarker === 'function') {
      const side = direction === 'call' ? 'buy' : 'sell'
      const { x, y } = this._getMarkerPosition(side)
      this.onMarker({ 
        id: tradeId,
        x, 
        y, 
        side, 
        action: 'add',
        timestamp: Date.now()
      })
      this.activeMarkers.add(tradeId)
      this.log(`📍 Seta adicionada no gráfico: ${side.toUpperCase()}`)
    }

    const tradeDuration = Math.random() * 30000 + 30000
    
    const isWin = Math.random() < winChance
    const profit = isWin ? this.entryValue * 0.8 : -this.entryValue

    this.totalTrades++
    if (isWin) { this.winTrades++; this.log(`✅ Trade ganho: +R$ ${profit.toFixed(2)}`) }
    else       { this.lossTrades++; this.log(`❌ Trade perdido: R$ ${profit.toFixed(2)}`) }
    this.currentProfit += profit

    this.onTrade?.({
      id: this.totalTrades,
      ts: Date.now(),
      direction,
      entry: this.entryValue,
      profit,
      isWin
    })

    try {
      if (avalonSdk?.isConnected || avalonSdk?.useMock) {
        await avalonSdk.buyBlitzOption(direction, this.entryValue)
        this.log(`✅ Trade executado no broker: ${direction.toUpperCase()}`)
      }
    } catch (error) {
      this.log(`❌ Erro no trade real: ${error.message}`)
    }

    setTimeout(() => {
      if (typeof this.onMarker === 'function') {
        this.onMarker({ 
          id: tradeId,
          action: 'remove'
        })
        this.activeMarkers.delete(tradeId)
        this.log(`🗑️ Seta removida do gráfico: ${direction.toUpperCase()}`)
        
        setTimeout(() => this._processNextTrade(), 1000)
      }
    }, tradeDuration)
  }

  _processNextTrade() {
    if (this.pendingTrades.length > 0 && this.activeMarkers.size === 0) {
      const nextTrade = this.pendingTrades.shift()
      this.log(`🔄 Processando próximo trade da fila: ${nextTrade.direction.toUpperCase()}`)
      this._executeTradeNow(nextTrade.direction, nextTrade.winChance)
    }
  }

  updateStats() {
    const winRate = this.totalTrades > 0 ? (this.winTrades / this.totalTrades * 100).toFixed(1) : 0
    const stats = {
      isRunning: this.isRunning,
      currentProfit: this.currentProfit,
      totalTrades: this.totalTrades,
      winTrades: this.winTrades,
      lossTrades: this.lossTrades,
      winRate,
      strategy: this.strategy,
      entryValue: this.entryValue,
      target: this.target,
      stopLoss: this.stopLoss
    }
    this.onUpdate?.(stats)
  }

  log(message) {
    const timestamp = new Date().toLocaleTimeString('pt-BR')
    console.log(`[${timestamp}] Bot: ${message}`)
    this.onUpdate?.({ log: `[${timestamp}] ${message}` })
  }

  getStats() {
    const winRate = this.totalTrades > 0 ? (this.winTrades / this.totalTrades * 100).toFixed(1) : 0
    return {
      isRunning: this.isRunning,
      currentProfit: this.currentProfit,
      totalTrades: this.totalTrades,
      winTrades: this.winTrades,
      lossTrades: this.lossTrades,
      winRate,
      strategy: this.strategy,
      entryValue: this.entryValue,
      target: this.target,
      stopLoss: this.stopLoss
    }
  }
}

export default new TradingBot()
