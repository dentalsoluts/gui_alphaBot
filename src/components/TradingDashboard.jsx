import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Bot, TrendingUp, DollarSign, Target, StopCircle, Settings, User, Wallet, Play, Square, LogOut } from 'lucide-react'
import CandlestickChart from './CandlestickChart.jsx'
import BotStatus from './BotStatus.jsx'
import avalonSdk from '../services/avalonSdk.js'
import tradingBot from '../services/tradingBot.js'
import './TradingDashboard.css'

const fmtBRL = (v) => `R$ ${Number(v).toFixed(2)}`

const TradingDashboard = ({ userData = {}, onLogout }) => {
  // saldo
  const [balance, setBalance] = useState(userData.balance ?? 10950.00)

  // params
  const [strategy, setStrategy] = useState('Agressivo')
  const [entryValue, setEntryValue] = useState(10)
  const [target, setTarget] = useState(100)
  const [stopLoss, setStopLoss] = useState(50)

  // bot
  const [botStats, setBotStats] = useState(null)
  const [botLogs, setBotLogs] = useState([])

  // gráfico
  const [markers, setMarkers] = useState([])
  const lastCandleRef = useRef(null)
  const [timeframeMs, setTimeframeMs] = useState(30_000)

  // relatório
  const [trades, setTrades] = useState([])
  const [panelRaised, setPanelRaised] = useState(false)
  
  const [botPanelOpen, setBotPanelOpen] = useState(false)

  // === Callbacks do bot ===
  useEffect(() => {
    tradingBot.setMarketStateProvider(() => lastCandleRef.current)
    tradingBot.setMarkerCallback((m) => {
      if (m.action === 'add') {
        setMarkers(prev => [...prev, m])
      } else if (m.action === 'remove') {
        setMarkers(prev => prev.filter(marker => marker.id !== m.id))
      }
    })
    tradingBot.setTradeCallback?.((t) => {
      setTrades(prev => [...prev, t].slice(-200))
    })
    tradingBot.setUpdateCallback((update) => {
      if (update?.log) {
        setBotLogs(prev => [...prev, update.log].slice(-20))
      } else {
        setBotStats(update)
      }
    })
    return () => {
      tradingBot.setMarkerCallback(null)
      tradingBot.setTradeCallback?.(null)
      tradingBot.setMarketStateProvider(null)
      tradingBot.setUpdateCallback(null)
    }
  }, [])

  // saldo
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const balanceInfo = await avalonSdk.getBalance()
        if (!cancelled && balanceInfo) {
          const next = balanceInfo.demo ?? balanceInfo.real ?? balance
          setBalance(Number(next))
        }
      } catch (e) {
        console.error('Erro ao atualizar saldo:', e)
      }
    }
    const id = setInterval(tick, 10000)
    tick()
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  // métricas do relatório
  const metrics = useMemo(() => {
    const totalTrades = trades.length
    const totalEntry = trades.reduce((s, t) => s + (t.entry ?? 0), 0)
    const grossWin   = trades.reduce((s, t) => s + (t.profit > 0 ? t.profit : 0), 0)
    const grossLoss  = trades.reduce((s, t) => s + (t.profit < 0 ? Math.abs(t.profit) : 0), 0)
    const netProfit  = grossWin - grossLoss
    const winRate    = totalTrades ? ((trades.filter(t => t.isWin).length / totalTrades) * 100).toFixed(1) : '0.0'
    return { totalTrades, totalEntry, grossWin, grossLoss, netProfit, winRate }
  }, [trades])

  // ações
  const handleStartBot = async () => {
    tradingBot.setParameters(strategy, entryValue, target, stopLoss)
    setMarkers([])
    setTrades([])
    const started = await tradingBot.start()
    if (started) {
      setBotStats(tradingBot.getStats())
      setBotPanelOpen(true)
      setPanelRaised(true)
    }
  }

  const handleStopBot = () => {
    const stopped = tradingBot.stop()
    if (stopped) {
      setBotStats(tradingBot.getStats())
    }
  }

  // puxar a aba para baixo = parar bot + voltar controles
  const lowerPanelAndStop = () => {
    if (botStats?.isRunning) handleStopBot()
    setPanelRaised(false)
  }

  const handleConfigureBot = () => {
    if (botStats?.isRunning) return
    tradingBot.setParameters(strategy, entryValue, target, stopLoss)
  }

  const handleLogout = async () => {
    if (botStats?.isRunning) tradingBot.stop()
    try { await avalonSdk.disconnect?.() } catch {}
    onLogout?.()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <img src="/logoAlphaBot.png" alt="" className="h-8 w-auto" />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{userData.name ?? 'Samuel Martins'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">{fmtBRL(balance)}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        <div className={`${botPanelOpen ? 'w-80' : 'w-0'} border-r border-border transition-all duration-300 ease-in-out overflow-hidden`}>
          <div className="h-full p-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <span>Status do Bot</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBotPanelOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)] overflow-auto">
                <BotStatus botStats={botStats} logs={botLogs} />
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex-1 p-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Gráfico de Candles - Avalon Broker</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <select
                      value={timeframeMs}
                      onChange={(e) => setTimeframeMs(Number(e.target.value))}
                      className="strategy-select px-2 py-1 text-sm"
                      title="Intervalo do gráfico"
                    >
                      <option value={5000}>5s</option>
                      <option value={10000}>10s</option>
                      <option value={15000}>15s</option>
                      <option value={30000}>30s</option>
                      <option value={60000}>1m</option>
                      <option value={120000}>2m</option>
                      <option value={300000}>5m</option>
                      <option value={600000}>10m</option>
                      <option value={900000}>15m</option>
                      <option value={1800000}>30m</option>
                    </select>
                  </div>
                  {!botPanelOpen && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBotPanelOpen(true)}
                      className="flex items-center space-x-2"
                    >
                      <Bot className="h-4 w-4" />
                      <span>Status Bot</span>
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              <CandlestickChart
                isConnected
                externalMarkers={markers}
                onTick={(c) => { lastCandleRef.current = c }}
                timeframeMs={timeframeMs}
              />
            </CardContent>
          </Card>
        </div>
        <div className="w-80 border-l border-border relative overflow-hidden">
          <div
            className={`absolute inset-0 bg-card p-4 space-y-4 transition-transform duration-500 ease-in-out 
              ${panelRaised ? '-translate-y-full' : 'translate-y-0'}`}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-semibold">Inteligência Artificial</span>
              </div>
              <Badge variant="secondary" className="w-full justify-center">
                Claude 3.5 Sonnet
              </Badge>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <span className="font-semibold">Estratégia</span>
              </div>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                disabled={botStats?.isRunning}
                className="strategy-select w-full p-2 text-center"
              >
                <option value="Conservador">Conservador</option>
                <option value="Moderado">Moderado</option>
                <option value="Agressivo">Agressivo</option>
              </select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-semibold">Valor da entrada</span>
              </div>
              <Input
                type="number"
                value={entryValue}
                onChange={(e) => setEntryValue(Number(e.target.value || 0))}
                className="text-center"
                disabled={botStats?.isRunning}
                min="1"
                max="1000"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-chart-4" />
                <span className="font-semibold">Meta</span>
              </div>
              <Input
                type="number"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value || 0))}
                className="text-center"
                disabled={botStats?.isRunning}
                min="10"
                max="10000"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <StopCircle className="h-5 w-5 text-destructive" />
                <span className="font-semibold">Stop loss</span>
              </div>
              <Input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value || 0))}
                className="text-center"
                disabled={botStats?.isRunning}
                min="5"
                max="1000"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              {!botStats?.isRunning ? (
                <Button
                  onClick={handleStartBot}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground bot-control-button"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  INICIAR
                </Button>
              ) : (
                <Button
                  onClick={handleStopBot}
                  variant="destructive"
                  className="w-full bot-control-button"
                  size="lg"
                >
                  <Square className="h-4 w-4 mr-2" />
                  PARAR
                </Button>
              )}

              <Button
                onClick={handleConfigureBot}
                variant="outline"
                className="w-full bot-control-button"
                disabled={botStats?.isRunning}
              >
                <Settings className="h-4 w-4 mr-2" />
                CONFIGURAR AUTOMÁTICO
              </Button>
            </div>

            <Separator />

            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {fmtBRL(balance)}
              </div>
              <p className="text-sm text-muted-foreground">Saldo Atual</p>
            </div>

            {botStats && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={botStats.isRunning ? "default" : "secondary"} className="text-xs">
                      {botStats.isRunning ? 'Ativo' : 'Parado'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Trades:</span><span>{botStats.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa:</span><span className="text-primary">{botStats.winRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lucro:</span>
                    <span className={botStats.currentProfit >= 0 ? 'text-primary' : 'text-destructive'}>
                      {fmtBRL(botStats.currentProfit)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Camada 2: RELATÓRIO (sobe quando panelRaised === true) */}
          <div
            className={`absolute inset-0 bg-card transition-transform duration-500 ease-in-out 
              ${panelRaised ? 'translate-y-0' : 'translate-y-full'}`}
          >
            {/* puxador para “baixar” e parar */}
            <div className="w-full flex justify-center pt-2">
              <button
                onClick={lowerPanelAndStop}
                className="h-1.5 w-12 rounded-full bg-muted-foreground/40 hover:bg-muted-foreground/60 transition-colors"
                aria-label="Puxar para baixo e parar"
                title="Puxar para baixo e parar"
              />
            </div>

            <div className="px-4 py-3">
              <h3 className="text-base font-semibold mb-3">Relatório em execução</h3>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">Entradas (soma)</div>
                  <div className="text-lg font-semibold">{fmtBRL(metrics.totalEntry)}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">Lucro total</div>
                  <div className={`text-lg font-semibold ${metrics.netProfit>=0?'text-primary':'text-destructive'}`}>
                    {fmtBRL(metrics.netProfit)}
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">Ganhos</div>
                  <div className="text-lg font-semibold text-emerald-400">{fmtBRL(metrics.grossWin)}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">Perdas</div>
                  <div className="text-lg font-semibold text-destructive">{fmtBRL(metrics.grossLoss)}</div>
                </Card>
                <Card className="p-3 col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Taxa de vitória</div>
                      <div className="text-lg font-semibold">{metrics.winRate}%</div>
                    </div>
                    {botStats?.isRunning ? (
                      <Button variant="destructive" onClick={lowerPanelAndStop}>
                        <Square className="h-4 w-4 mr-2" /> Parar bot
                      </Button>
                    ) : (
                      <Badge variant="secondary">Parado</Badge>
                    )}
                  </div>
                </Card>
              </div>

              <Separator />

              <div className="mt-3">
                <div className="grid grid-cols-2 text-sm font-semibold mb-2">
                  <div>Entrada</div>
                  <div>Lucro</div>
                </div>
                <div className="space-y-1 max-h-[46vh] overflow-auto pr-2">
                  {trades.slice(-80).map((t) => (
                    <div key={t.id} className="grid grid-cols-2 text-sm">
                      <div className="text-foreground/90">{fmtBRL(t.entry)}</div>
                      <div className={t.profit >= 0 ? 'text-emerald-400' : 'text-destructive'}>
                        {t.profit >= 0 ? '+' : '-'}{fmtBRL(Math.abs(t.profit))}
                      </div>
                    </div>
                  ))}
                  {!trades.length && <div className="text-sm text-muted-foreground">Sem trades ainda…</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ===== fim sidebar ===== */}
      </div>
    </div>
  )
}

export default TradingDashboard
