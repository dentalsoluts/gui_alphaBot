import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Activity, TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react'

const BotStatus = ({ botStats, logs }) => {
  const [displayLogs, setDisplayLogs] = useState([])

  useEffect(() => {
    if (logs && logs.length > 0) {
      setDisplayLogs(prev => [...prev, ...logs].slice(-10)) // Manter apenas os últimos 10 logs
    }
  }, [logs])

  if (!botStats) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Status do Bot</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Bot não iniciado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { 
    isRunning, 
    currentProfit, 
    totalTrades, 
    winTrades, 
    lossTrades, 
    winRate,
    strategy,
    target,
    stopLoss
  } = botStats

  const profitColor = currentProfit >= 0 ? 'text-primary' : 'text-destructive'
  const profitIcon = currentProfit >= 0 ? TrendingUp : TrendingDown

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Status do Bot</span>
          </div>
          <Badge variant={isRunning ? "default" : "secondary"}>
            {isRunning ? 'Ativo' : 'Parado'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lucro Atual */}
        <div className="text-center">
          <div className={`text-2xl font-bold ${profitColor} flex items-center justify-center space-x-1`}>
            {React.createElement(profitIcon, { className: "h-6 w-6" })}
            <span>R$ {currentProfit.toFixed(2)}</span>
          </div>
          <p className="text-sm text-muted-foreground">Lucro/Prejuízo Atual</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold">{totalTrades}</div>
            <p className="text-xs text-muted-foreground">Total Trades</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">{winRate}%</div>
            <p className="text-xs text-muted-foreground">Taxa de Acerto</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">{winTrades}</div>
            <p className="text-xs text-muted-foreground">Ganhos</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-destructive">{lossTrades}</div>
            <p className="text-xs text-muted-foreground">Perdas</p>
          </div>
        </div>

        {/* Metas */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Meta:</span>
            <span className="text-sm font-semibold text-chart-4">R$ {target}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Stop Loss:</span>
            <span className="text-sm font-semibold text-destructive">R$ -{stopLoss}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Estratégia:</span>
            <span className="text-sm font-semibold">{strategy}</span>
          </div>
        </div>

        {/* Progress Bar para Meta */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Progresso</span>
            <span>{((currentProfit / target) * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.max(0, Math.min(100, (currentProfit / target) * 100))}%` 
              }}
            />
          </div>
        </div>

        {/* Logs */}
        {displayLogs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>Logs Recentes</span>
            </h4>
            <ScrollArea className="h-32 w-full rounded border p-2">
              <div className="space-y-1">
                {displayLogs.map((log, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BotStatus

