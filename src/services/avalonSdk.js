// Integração com o SDK da Avalon com fallback para mock
import mockSdk from './mockAvalonSdk.js'

class AvalonSdkWrapper {
  constructor() {
    this.sdk = null
    this.isConnected = false
    this.useMock = false
    this.balances = null
    this.quotes = null
    this.blitzOptions = null
    this.positions = null
  }

  async connect(email, password) {
    try {
      // Tentar conexão real primeiro
      const { 
        ClientSdk, 
        BalanceType, 
        BlitzOptionsDirection,
        LoginPasswordAuthMethod 
      } = await import('@quadcode-tech/client-sdk-js')
      
      // Configuração para Avalon Broker
      const wsUrl = 'wss://ws.trade.avalonbroker.com/echo/websocket'
      const appId = 82
      const apiUrl = 'https://api.trade.avalonbroker.com'
      
      const authMethod = new LoginPasswordAuthMethod(apiUrl, email, password)
      
      this.sdk = await ClientSdk.create(wsUrl, appId, authMethod, {
        host: 'https://trade.avalonbroker.com'
      })
      
      // Inicializar serviços
      this.balances = await this.sdk.balances()
      this.quotes = await this.sdk.quotes()
      this.blitzOptions = await this.sdk.blitzOptions()
      this.positions = await this.sdk.positions()
      
      this.isConnected = true
      this.useMock = false
      
      return { 
        success: true, 
        message: 'Conectado com sucesso à Avalon!' 
      }
    } catch (error) {
      console.warn('Conexão real falhou, usando modo demonstração:', error.message)
      
      // Fallback para mock
      this.useMock = true
      return await mockSdk.connect(email, password)
    }
  }

  disconnect() {
    if (this.useMock) {
      mockSdk.disconnect()
    } else {
      this.sdk = null
      this.balances = null
      this.quotes = null
      this.blitzOptions = null
      this.positions = null
    }
    
    this.isConnected = false
  }

  async getBalance() {
    if (this.useMock) {
      return await mockSdk.getBalance()
    }
    
    if (!this.balances) return null
    
    try {
      const { BalanceType } = await import('@quadcode-tech/client-sdk-js')
      const allBalances = this.balances.getBalances()
      const demoBalance = allBalances.find(balance => balance.type === BalanceType.Demo)
      const realBalance = allBalances.find(balance => balance.type === BalanceType.Real)
      
      return {
        demo: demoBalance ? demoBalance.amount : 0,
        real: realBalance ? realBalance.amount : 0,
        current: demoBalance || realBalance
      }
    } catch (error) {
      console.error('Erro ao obter saldo:', error)
      return null
    }
  }

  async getPositions() {
    if (this.useMock) {
      return await mockSdk.getPositions()
    }
    
    if (!this.positions) return []
    
    try {
      return this.positions.getAllPositions()
    } catch (error) {
      console.error('Erro ao obter posições:', error)
      return []
    }
  }

  async buyBlitzOption(direction, amount, activeId = 1) {
    if (this.useMock) {
      return await mockSdk.buyBlitzOption(direction, amount)
    }
    
    if (!this.blitzOptions || !this.balances) {
      throw new Error('Serviços não inicializados')
    }
    
    try {
      const { BalanceType, BlitzOptionsDirection } = await import('@quadcode-tech/client-sdk-js')
      
      const actives = this.blitzOptions.getActives()
      const active = actives.find(a => a.id === activeId && a.canBeBoughtAt(new Date()))
      
      if (!active) {
        throw new Error('Ativo não disponível para compra')
      }
      
      const balance = this.balances.getBalances().find(b => b.type === BalanceType.Demo)
      if (!balance) {
        throw new Error('Saldo não encontrado')
      }
      
      const expirationTime = active.expirationTimes[0]
      const option = await this.blitzOptions.buy(
        active,
        direction === 'call' ? BlitzOptionsDirection.Call : BlitzOptionsDirection.Put,
        expirationTime,
        amount,
        balance
      )
      
      return option
    } catch (error) {
      console.error('Erro ao comprar opção:', error)
      throw error
    }
  }

  async resetDemoBalance() {
    if (this.useMock) {
      return await mockSdk.resetDemoBalance()
    }
    
    if (!this.balances) return false
    
    try {
      const { BalanceType } = await import('@quadcode-tech/client-sdk-js')
      const demoBalance = this.balances.getBalances().find(b => b.type === BalanceType.Demo)
      if (demoBalance) {
        await demoBalance.resetDemoBalance()
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao resetar saldo demo:', error)
      return false
    }
  }

  async getCurrentQuote(activeId = 1) {
    if (this.useMock) {
      return await mockSdk.getMarketData()
    }
    
    if (!this.quotes) return null
    
    try {
      const currentQuote = await this.quotes.getCurrentQuoteForActive(activeId)
      return currentQuote
    } catch (error) {
      console.error('Erro ao obter cotação:', error)
      return null
    }
  }

  async getCandleData(symbol = 'EURUSD', timeframe = '1m', count = 100) {
    if (this.useMock) {
      return await mockSdk.getCandleData(symbol, timeframe, count)
    }
    
    // Para a versão real, implementar quando necessário
    // Por enquanto, usar dados mock para o gráfico
    return await mockSdk.getCandleData(symbol, timeframe, count)
  }
}

export default new AvalonSdkWrapper()

