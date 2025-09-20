import { useEffect, useMemo, useState } from 'react'
import { ComposedChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar, ReferenceDot } from 'recharts'

// === Ajustes gerais ===
export const ARROW_PADDING = 0.0002
const CANDLE_MS = 60_000           // 1 minuto
const MAX_MARKERS = 120            // quantas setas renderizar no máximo

// === Mock de candles (50 velas) ===
function generateMockCandleData() {
  const data = []
  let price = 1.25
  const now = Date.now()

  for (let i = 0; i < 50; i++) {
    const ts = now - (49 - i) * CANDLE_MS
    const open = price
    const change = (Math.random() - 0.5) * 0.01
    const close = open + change
    const high = Math.max(open, close) + Math.random() * 0.005
    const low  = Math.min(open, close)  - Math.random() * 0.005

    data.push({
      timeMs: ts,
      time: new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      open: +open.toFixed(5),
      high: +high.toFixed(5),
      low:  +low.toFixed(5),
      close:+close.toFixed(5),
      volume: Math.floor(Math.random() * 1000) + 100,
      durationMs: CANDLE_MS,
    })
    price = close
  }
  return data
}

// === Desenho de um candle (barrinha custom) ===
const CandleBar = (props) => {
  const { payload, x, y, width, height } = props
  if (!payload) return null
  const { open, high, low, close } = payload

  const isGreen = close >= open
  const color = isGreen ? '#00ff88' : '#ef4444'

  const range      = Math.max(high - low, 1e-9)
  const bodyHeight = Math.max(Math.abs(close - open) * height / range, 1)
  const bodyY      = y + (high - Math.max(open, close)) * height / range
  const wickTop    = y + (high - Math.max(open, close)) * height / range
  const wickBottom = y + (high - Math.min(open, close)) * height / range

  return (
    <g>
      {/* pavio superior */}
      <line x1={x + width / 2} y1={wickTop} x2={x + width / 2} y2={bodyY} stroke={color} strokeWidth={1} />
      {/* corpo */}
      <rect
        x={x + width * 0.2}
        y={bodyY}
        width={width * 0.6}
        height={bodyHeight}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
      {/* pavio inferior */}
      <line x1={x + width / 2} y1={wickBottom} x2={x + width / 2} y2={bodyY + bodyHeight} stroke={color} strokeWidth={1} />
    </g>
  )
}

/**
 * Seta que nasce **de dentro** do candle:
 *  - BUY (COMPRA): triângulo aponta PARA CIMA (▲) - cor vermelha
 *  - SELL (VENDA): triângulo aponta PARA BAIXO (▼) - cor azul
 *  Nada de "haste" pra fora: tudo fica dentro do range da vela.
 */
const ArrowInsideShape = ({ cx, cy, side = 'buy', size = 8, opacity = 1 }) => {
  const isBuy = side === 'buy'
  const fill = isBuy ? '#ef4444' : '#3b82f6' // Vermelho para compra (seta para cima), azul para venda (seta para baixo)
  // desenha triângulo 100% para um lado do centro (não vaza do outro lado)
  // BUY (COMPRA): triângulo para cima (vértice em cy, estende -size px)
  // SELL (VENDA): triângulo para baixo (vértice em cy, estende +size px)
  return (
    <g transform={`translate(${cx}, ${cy})`} opacity={opacity} filter="url(#markerShadow)" pointerEvents="none">
      {isBuy
        ? (
          // ▲ (COMPRA - aponta para cima - VERMELHO)
          <path
            d={`M 0 0 L ${-size/2} ${-size} L ${size/2} ${-size} Z`}
            fill={fill}
            stroke="white"
            strokeWidth="1"
          />
        )
        : (
          // ▼ (VENDA - aponta para baixo - AZUL)
          <path
            d={`M 0 0 L ${-size/2} ${size} L ${size/2} ${size} Z`}
            fill={fill}
            stroke="white"
            strokeWidth="1"
          />
        )
      }
    </g>
  )
}

/**
 * Props esperadas:
 * - isConnected?: boolean
 * - externalMarkers: Array<{ id?: number; x: number; side: 'buy'|'sell' }>
 *     -> x em ms (timestamp). o y é recalculado para ficar **dentro** da vela.
 * - onTick?: (lastCandle) => void
 */
export default function CandlestickChart({ isConnected = true, externalMarkers = [], onTick }) {
  const [candleData, setCandleData] = useState([])
  const [currentPrice, setCurrentPrice] = useState(null)

  // primeiro load
  useEffect(() => {
    const initial = generateMockCandleData()
    setCandleData(initial)
    setCurrentPrice(initial[initial.length - 1]?.close ?? null)
    onTick?.(initial[initial.length - 1])
  }, []) // eslint-disable-line

  // Mercado mock: rollover 1min + microticks
  useEffect(() => {
    if (!isConnected) return
    const id = setInterval(() => {
      setCandleData(prev => {
        if (!prev.length) return prev
        let arr = [...prev]
        let last = arr[arr.length - 1]
        const now = Date.now()

        // cria velas perdidas (se a aba ficou “parada”)
        while (now - last.timeMs >= CANDLE_MS) {
          const ts = last.timeMs + CANDLE_MS
          const bias = Math.sign(last.close - last.open) * 0.002
          const step = bias + (Math.random() - 0.5) * 0.004
          const open  = last.close
          const close = open + step
          const high  = Math.max(open, close) + Math.random() * 0.003
          const low   = Math.min(open, close) - Math.random() * 0.003
          const next = {
            timeMs: ts,
            time: new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            open:+open.toFixed(5), high:+high.toFixed(5), low:+low.toFixed(5), close:+close.toFixed(5),
            volume: Math.floor(Math.random() * 1000) + 100,
            durationMs: CANDLE_MS,
          }
          arr.push(next)
          if (arr.length > 50) arr = arr.slice(-50)
          last = arr[arr.length - 1]
        }

        // micro-movimento da última vela
        const l = arr[arr.length - 1]
        const micro = (Math.random() - 0.5) * 0.0015
        const newClose = +(l.close + micro).toFixed(5)
        const newHigh  = +Math.max(l.high, newClose).toFixed(5)
        const newLow   = +Math.min(l.low,  newClose).toFixed(5)
        const updated  = { ...l, close: newClose, high: newHigh, low: newLow }
        arr[arr.length - 1] = updated

        setCurrentPrice(newClose)
        onTick?.(updated)
        return arr
      })
    }, 800)
    return () => clearInterval(id)
  }, [isConnected, onTick])

  // Domínios
  const { yMin, yMax, xMin, xMax, lastDuration } = useMemo(() => {
    if (!candleData.length) return { yMin: 0, yMax: 1, xMin: 0, xMax: 1, lastDuration: CANDLE_MS }
    let minLow = Infinity, maxHigh = -Infinity, minT = Infinity, maxT = -Infinity
    for (const c of candleData) {
      if (c.low  < minLow)  minLow  = c.low
      if (c.high > maxHigh) maxHigh = c.high
      if (c.timeMs < minT)  minT    = c.timeMs
      if (c.timeMs > maxT)  maxT    = c.timeMs
    }
    const last = candleData[candleData.length - 1]
    return { yMin: minLow, yMax: maxHigh, xMin: minT, xMax: maxT, lastDuration: last?.durationMs ?? CANDLE_MS }
  }, [candleData])

  // ===== Empilhar setas DENTRO do candle (BUY em cima, SELL embaixo) =====
  const styledMarkers = useMemo(() => {
    if (!externalMarkers?.length || !candleData.length) return []

    const rightPad = lastDuration * 0.5
    const left = xMin, right = xMax + rightPad

    // acha índice da vela do timestamp (ou a mais próxima)
    const findCandleIndex = (x) => {
      const dur = lastDuration
      let idx = candleData.findIndex(c => x >= c.timeMs && x < c.timeMs + (c.durationMs ?? dur))
      if (idx === -1) {
        let bestI = 0, bestD = Infinity
        for (let i = 0; i < candleData.length; i++) {
          const d = Math.abs(candleData[i].timeMs - x)
          if (d < bestD) { bestD = d; bestI = i }
        }
        idx = bestI
      }
      return idx
    }

    // filtra/limita markers visíveis
    const filtered = externalMarkers
      .filter(m => m.x >= left && m.x <= right)
      .slice(-MAX_MARKERS)
      .sort((a, b) => a.x - b.x)

    // agrupa por (candleIndex, side)
    const groups = new Map() // key: `${i}-${side}` -> array
    filtered.forEach((m) => {
      const i = findCandleIndex(m.x)
      const key = `${i}-${m.side}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(m)
    })

    const out = []
    const globalLen = filtered.length
    for (const [key, arr] of groups) {
      arr.sort((a, b) => a.x - b.x) // estética
      const [idxStr, side] = key.split('-')
      const i = Number(idxStr)
      const c = candleData[i]
      const range = Math.max(1e-9, c.high - c.low)

      // margens e gap entre as metades
      const margin = Math.max(ARROW_PADDING * 6, range * 0.06)
      const gapMid = Math.max(ARROW_PADDING * 4, range * 0.02)
      const mid = (c.high + c.low) / 2

      let laneTop, laneBottom
      if (side === 'buy') {
        laneTop = c.high - margin
        laneBottom = mid + gapMid
      } else {
        laneTop = mid - gapMid
        laneBottom = c.low + margin
      }

      const laneHeight = Math.max(1e-9, laneTop - laneBottom)
      const step = laneHeight / (arr.length + 1) // distribui igualmente

      arr.forEach((m, k) => {
        const y = side === 'buy'
          ? laneTop - step * (k + 1)   // quanto mais setas, mais “para dentro” do candle
          : laneBottom + step * (k + 1)

        const idxInFiltered = filtered.indexOf(m)
        const rel = (globalLen - idxInFiltered) / globalLen
        const opacity = 0.35 + 0.65 * rel

        // primeira de cada faixa ligeiramente maior (pixel)
        const size = k === 0 ? 9 : 7

        out.push({
          ...m,
          y: Math.min(laneTop, Math.max(laneBottom, y)), // clamp seguro
          size,
          opacity,
          id: m.id ?? `${m.x}-${m.side}-${i}-${k}`,
        })
      })
    }

    return out.sort((a, b) => a.x - b.x)
  }, [externalMarkers, candleData, xMin, xMax, lastDuration])

  if (!isConnected) {
    return (
      <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-4 text-muted-foreground">📈</div>
          <p className="text-muted-foreground">Conecte-se para visualizar o gráfico</p>
          <p className="text-sm text-muted-foreground mt-2">Dados em tempo real (mock)</p>
        </div>
      </div>
    )
  }

  // respiros do gráfico
  const rightPad = lastDuration * 0.5
  const yRange = Math.max(1e-6, yMax - yMin)
  const yPad = Math.max(0.0008, yRange * 0.08)

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">EUR/USD</h3>
          <p className="text-sm text-muted-foreground">Gráfico de 1 minuto (mock)</p>
        </div>
        {currentPrice != null && (
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {currentPrice.toFixed(5)}
            </div>
            <div className="text-sm text-muted-foreground">Preço atual</div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart data={candleData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            {/* sombra suave nas setas */}
            <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0.5" stdDeviation="1" floodOpacity="0.4" />
            </filter>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#444444" />

          {/* X temporal com respiro à direita */}
          <XAxis
            dataKey="timeMs"
            type="number"
            scale="time"
            domain={[xMin, xMax + rightPad]}
            tickFormatter={(ms) => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            stroke="#888888"
            fontSize={12}
          />

          {/* Y com padding suficiente para setas */}
          <YAxis
            domain={[yMin - yPad, yMax + yPad]}
            stroke="#888888"
            fontSize={12}
            tickFormatter={(v) => v.toFixed(5)}
          />

          {/* candles */}
          <Bar dataKey="high" shape={<CandleBar />} isAnimationActive={false} />

          {/* setas empilhadas DENTRO do candle */}
          {styledMarkers.map((m) => (
            <ReferenceDot
              key={m.id}
              x={m.x}
              y={m.y}
              r={0}
              isFront
              ifOverflow="hidden"
              shape={(props) => <ArrowInsideShape {...props} side={m.side} size={m.size} opacity={m.opacity} />}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
