import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Circle, User, Filter, ChevronDown } from 'lucide-react'

const ZONE_COLORS = {
  'Fine Leg': '#ef4444',
  'Square Leg': '#f97316',
  'Mid Wicket': '#eab308',
  'Long on': '#22c55e',
  'Long of': '#14b8a6',
  'Cover': '#3b82f6',
  'Point': '#8b5cf6',
  '3rd man': '#ec4899',
}

const EVENT_COLORS = {
  'six': '#eab308',
  'four': '#22c55e',
  'run': '#3b82f6',
  'no run': '#6b7280',
  'wicket': '#ef4444',
  'wide': '#f97316',
  'no ball': '#f97316',
  'leg bye': '#8b5cf6',
}

export default function WagonWheel({ data }) {
  const canvasRef = useRef(null)
  const [selectedInnings, setSelectedInnings] = useState(0)
  const [selectedBatsman, setSelectedBatsman] = useState(null) // This stores the PID (external ID)
  const [showBatsmanDropdown, setShowBatsmanDropdown] = useState(false)

  const currentInnings = data?.innings?.[selectedInnings]
  const wagonData = currentInnings?.wagonData || []
  const batsmen = currentInnings?.batsmen || []

  // Filter by batsman PID if selected (wagonData uses batsmanId which is the external PID)
  const filteredData = selectedBatsman
    ? wagonData.filter(w => w.batsmanId === selectedBatsman)
    : wagonData

  // Find batsman info using PID
  const selectedBatsmanInfo = batsmen.find(b => b.pid === selectedBatsman)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 20

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw field background with gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, '#1a5c2a')
    gradient.addColorStop(0.5, '#1a472a')
    gradient.addColorStop(1, '#0f3018')
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw boundary ring
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.strokeStyle = '#ffffff40'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw inner circle (30-yard circle)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.45, 0, 2 * Math.PI)
    ctx.strokeStyle = '#ffffff25'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    ctx.stroke()
    ctx.setLineDash([])

    // Draw pitch in the center
    ctx.fillStyle = '#c4a35a'
    ctx.fillRect(centerX - 10, centerY - 50, 20, 100)

    // Pitch creases
    ctx.fillStyle = '#ffffff50'
    ctx.fillRect(centerX - 16, centerY - 45, 32, 2)
    ctx.fillRect(centerX - 16, centerY + 43, 32, 2)

    // Draw zone lines with labels
    const zones = [
      { angle: -22.5, label: '3rd Man' },
      { angle: 22.5, label: 'Point' },
      { angle: 67.5, label: 'Cover' },
      { angle: 112.5, label: 'Long Off' },
      { angle: 157.5, label: 'Long On' },
      { angle: 202.5, label: 'Mid Wicket' },
      { angle: 247.5, label: 'Square Leg' },
      { angle: 292.5, label: 'Fine Leg' },
    ]

    zones.forEach(zone => {
      const rad = (zone.angle * Math.PI) / 180
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(
        centerX + Math.cos(rad) * radius,
        centerY + Math.sin(rad) * radius
      )
      ctx.strokeStyle = '#ffffff15'
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw zone labels at outer edge
      const labelRad = ((zone.angle + 22.5) * Math.PI) / 180
      const labelX = centerX + Math.cos(labelRad) * (radius * 0.82)
      const labelY = centerY + Math.sin(labelRad) * (radius * 0.82)
      ctx.font = '9px sans-serif'
      ctx.fillStyle = '#ffffff50'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(zone.label, labelX, labelY)
    })

    // Draw shots
    filteredData.forEach((shot) => {
      const x = shot.xCoord
      const y = shot.yCoord

      // Skip if no coordinates
      if (x === 0 && y === 0) return

      // Normalize coordinates to canvas (assuming original is 360x360)
      const normalizedX = (x / 360) * width
      const normalizedY = (y / 360) * height

      // Determine color based on event
      const color = EVENT_COLORS[shot.eventName] || '#6b7280'

      // Draw shot line from center to point
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(normalizedX, normalizedY)
      ctx.strokeStyle = `${color}60`
      ctx.lineWidth = shot.batRun >= 4 ? 2.5 : 1.5
      ctx.stroke()

      // Draw shot point with glow effect for boundaries
      if (shot.batRun >= 4) {
        ctx.beginPath()
        ctx.arc(normalizedX, normalizedY, 10, 0, 2 * Math.PI)
        ctx.fillStyle = `${color}30`
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(normalizedX, normalizedY, shot.batRun >= 6 ? 7 : shot.batRun >= 4 ? 5 : 3, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = '#ffffff60'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Draw center point (batsman position)
    ctx.beginPath()
    ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#1a472a'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw batsman silhouette
    ctx.beginPath()
    ctx.arc(centerX, centerY - 2, 3, 0, 2 * Math.PI)
    ctx.fillStyle = '#1a472a'
    ctx.fill()
    ctx.fillRect(centerX - 1, centerY, 2, 6)

  }, [filteredData, selectedInnings])

  // Calculate stats from filtered data
  const stats = {
    totalRuns: filteredData.reduce((sum, s) => sum + (s.batRun || 0), 0),
    totalBalls: filteredData.length,
    fours: filteredData.filter(s => s.eventName === 'four').length,
    sixes: filteredData.filter(s => s.eventName === 'six').length,
    dots: filteredData.filter(s => s.batRun === 0 && s.eventName !== 'wicket').length,
    wickets: filteredData.filter(s => s.eventName === 'wicket').length,
    strikeRate: filteredData.length > 0
      ? ((filteredData.reduce((sum, s) => sum + (s.batRun || 0), 0) / filteredData.length) * 100).toFixed(1)
      : '0.0'
  }

  // Reset batsman when innings changes
  useEffect(() => {
    setSelectedBatsman(null)
    setShowBatsmanDropdown(false)
  }, [selectedInnings])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowBatsmanDropdown(false)
    if (showBatsmanDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showBatsmanDropdown])

  if (!data || !data.innings?.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Circle className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p>No wagon wheel data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Innings Selector */}
        {data.innings.length > 1 && (
          <div className="flex gap-2">
            {data.innings.map((inn, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedInnings(idx)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  selectedInnings === idx
                    ? 'bg-gradient-to-r from-ipl-gold to-ipl-orange text-ipl-dark shadow-lg shadow-ipl-gold/20'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                  {inn.battingTeam?.abbr || `Inn ${idx + 1}`}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Batsman Selector Dropdown */}
        {batsmen.length > 0 && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowBatsmanDropdown(!showBatsmanDropdown)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 border border-white/10 hover:border-ipl-gold/30 transition-all flex items-center gap-3 min-w-[200px]"
            >
              <User className="w-4 h-4 text-ipl-gold" />
              <span className="flex-1 text-left text-white">
                {selectedBatsman ? selectedBatsmanInfo?.name : 'All Batsmen'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showBatsmanDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showBatsmanDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="bg-ipl-navy absolute z-50 top-full left-0 mt-2 w-full min-w-[280px] bg-ipl-dark border border-white/20 rounded-xl shadow-2xl overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setSelectedBatsman(null)
                      setShowBatsmanDropdown(false)
                    }}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                      !selectedBatsman
                        ? 'bg-ipl-gold/20 text-ipl-gold'
                        : 'hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ipl-blue to-ipl-gold flex items-center justify-center">
                      <Filter className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">All Batsmen</p>
                      <p className="text-xs text-gray-500">{wagonData.length} shots total</p>
                    </div>
                  </button>

                  <div className="border-t border-white/10 max-h-[280px] overflow-y-auto">
                    {batsmen.map((bat) => {
                      // Count shots for this batsman using their PID
                      const batShotCount = wagonData.filter(w => w.batsmanId === bat.pid).length
                      return (
                        <button
                          key={bat.pid || bat.playerId}
                          onClick={() => {
                            setSelectedBatsman(bat.pid) // Use PID for filtering
                            setShowBatsmanDropdown(false)
                          }}
                          className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                            selectedBatsman === bat.pid
                              ? 'bg-ipl-gold/20 text-ipl-gold'
                              : 'hover:bg-white/10 text-gray-300'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ipl-blue/50 to-ipl-navy flex items-center justify-center text-xs font-bold text-white">
                            {bat.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">{bat.name}</p>
                            <p className="text-xs text-gray-500">
                              {bat.runs} ({bat.balls}) • {bat.fours}×4, {bat.sixes}×6
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{batShotCount} shots</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Selected Batsman Info */}
      {selectedBatsman && selectedBatsmanInfo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 border border-ipl-gold/20 bg-gradient-to-r from-ipl-gold/10 to-transparent"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ipl-gold to-ipl-orange flex items-center justify-center text-lg font-bold text-ipl-dark">
              {selectedBatsmanInfo.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-white">{selectedBatsmanInfo.name}</h4>
              <p className="text-sm text-gray-400">
                {selectedBatsmanInfo.runs} runs from {selectedBatsmanInfo.balls} balls •
                SR: {selectedBatsmanInfo.balls > 0 ? ((selectedBatsmanInfo.runs / selectedBatsmanInfo.balls) * 100).toFixed(1) : '-'}
              </p>
            </div>
            <button
              onClick={() => setSelectedBatsman(null)}
              className="px-3 py-1.5 text-xs bg-white/10 rounded-lg text-gray-300 hover:bg-white/20 transition-colors"
            >
              Clear Filter
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Wagon Wheel Canvas */}
        <div className="lg:col-span-2">
          <div className="relative aspect-square max-w-lg mx-auto">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="w-full h-full rounded-2xl"
              style={{ filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.4))' }}
            />

            {/* Legend */}
            <div className="absolute top-4 right-4 bg-ipl-dark/95 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <p className="text-xs font-medium text-gray-400 mb-2">Shot Types</p>
              <div className="space-y-1.5">
                {[
                  { key: 'six', label: 'Six', color: EVENT_COLORS.six },
                  { key: 'four', label: 'Four', color: EVENT_COLORS.four },
                  { key: 'run', label: '1-3 Runs', color: EVENT_COLORS.run },
                  { key: 'no run', label: 'Dot', color: EVENT_COLORS['no run'] },
                  { key: 'wicket', label: 'Wicket', color: EVENT_COLORS.wicket },
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-gray-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Statistics</h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-ipl-gold/20 to-transparent rounded-xl p-4 border border-ipl-gold/20">
              <p className="text-3xl font-display text-ipl-gold">{stats.totalRuns}</p>
              <p className="text-xs text-gray-400 mt-1">Runs Scored</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-display text-white">{stats.totalBalls}</p>
              <p className="text-xs text-gray-400 mt-1">Balls Faced</p>
            </div>
            <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
              <p className="text-3xl font-display text-green-400">{stats.fours}</p>
              <p className="text-xs text-gray-400 mt-1">Fours</p>
            </div>
            <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
              <p className="text-3xl font-display text-yellow-400">{stats.sixes}</p>
              <p className="text-xs text-gray-400 mt-1">Sixes</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-display text-gray-400">{stats.dots}</p>
              <p className="text-xs text-gray-400 mt-1">Dot Balls</p>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
              <p className="text-3xl font-display text-blue-400">{stats.strikeRate}</p>
              <p className="text-xs text-gray-400 mt-1">Strike Rate</p>
            </div>
          </div>

          {stats.wickets > 0 && (
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-red-400" />
                <span className="text-lg font-semibold text-red-400">{stats.wickets}</span>
                <span className="text-sm text-gray-400">Wickets Lost</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone Stats */}
      {data?.zoneStats && Object.keys(data.zoneStats).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Scoring Zones</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(data.zoneStats).map(([zone, zoneStats]) => (
              <div
                key={zone}
                className="bg-white/5 rounded-xl p-4 border-l-4 hover:bg-white/10 transition-colors"
                style={{ borderLeftColor: ZONE_COLORS[zone] || '#6b7280' }}
              >
                <p className="text-sm font-semibold text-white mb-2">{zone}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-ipl-gold font-bold">{zoneStats.runs}</p>
                    <p className="text-gray-500">runs</p>
                  </div>
                  <div>
                    <p className="text-green-400 font-bold">{zoneStats.fours}</p>
                    <p className="text-gray-500">4s</p>
                  </div>
                  <div>
                    <p className="text-yellow-400 font-bold">{zoneStats.sixes}</p>
                    <p className="text-gray-500">6s</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
