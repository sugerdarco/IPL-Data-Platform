import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  Filter, 
  ChevronDown, 
  Zap, 
  Target, 
  AlertCircle,
  Circle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const EVENT_BADGES = {
  wicket: { color: 'bg-red-500', icon: '🎯', label: 'WICKET' },
  six: { color: 'bg-yellow-500', icon: '6️⃣', label: 'SIX' },
  four: { color: 'bg-green-500', icon: '4️⃣', label: 'FOUR' },
}

export default function Commentary({ 
  data, 
  loading, 
  onFilterChange,
  onPageChange,
  currentPage = 1,
  totalPages = 1
}) {
  const [selectedInnings, setSelectedInnings] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [eventFilter, setEventFilter] = useState([])

  const commentaries = data?.commentaries || []
  const innings = data?.innings || []
  const highlights = data?.highlights || {}

  const handleEventFilterToggle = (event) => {
    const newFilter = eventFilter.includes(event)
      ? eventFilter.filter(e => e !== event)
      : [...eventFilter, event]
    setEventFilter(newFilter)
    onFilterChange?.({ 
      events: newFilter.length > 0 ? newFilter.join(',') : undefined,
      inningsNumber: selectedInnings
    })
  }

  const handleInningsChange = (innNum) => {
    setSelectedInnings(innNum)
    onFilterChange?.({ 
      inningsNumber: innNum,
      events: eventFilter.length > 0 ? eventFilter.join(',') : undefined
    })
  }

  const formatOverBall = (over, ball) => {
    return `${over}.${ball}`
  }

  return (
    <div className="space-y-4">
      {/* Header with Highlights */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-ipl-gold" />
            Ball by Ball Commentary
          </h3>
          
          {/* Highlight counters */}
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
              🎯 {highlights.wickets || 0} Wickets
            </span>
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
              6️⃣ {highlights.sixes || 0} Sixes
            </span>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
              4️⃣ {highlights.fours || 0} Fours
            </span>
          </div>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/5 rounded-xl p-4 space-y-4">
              {/* Innings Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Innings</label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleInningsChange(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      selectedInnings === null
                        ? 'bg-ipl-gold text-ipl-dark'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    All
                  </button>
                  {innings.map((inn) => (
                    <button
                      key={inn.number}
                      onClick={() => handleInningsChange(inn.number)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        selectedInnings === inn.number
                          ? 'bg-ipl-gold text-ipl-dark'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {inn.battingTeam?.abbr || `Innings ${inn.number}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Events</label>
                <div className="flex gap-2 flex-wrap">
                  {['wicket', 'six', 'four'].map((event) => (
                    <button
                      key={event}
                      onClick={() => handleEventFilterToggle(event)}
                      className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-all ${
                        eventFilter.includes(event)
                          ? EVENT_BADGES[event]?.color + ' text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {EVENT_BADGES[event]?.icon} {event.charAt(0).toUpperCase() + event.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Commentary List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-ipl-gold border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading commentary...</p>
          </div>
        ) : commentaries.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No commentary available for this selection.
          </div>
        ) : (
          <div className="space-y-1">
            {commentaries.map((comm, index) => (
              <motion.div
                key={comm.eventId || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`p-3 rounded-lg border transition-colors ${
                  comm.isWicket
                    ? 'bg-red-500/10 border-red-500/30'
                    : comm.isSix
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : comm.isFour
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Over/Ball */}
                  <div className="flex-shrink-0 w-12 text-center">
                    <span className="text-lg font-bold text-ipl-gold">
                      {formatOverBall(comm.over, comm.ball)}
                    </span>
                  </div>

                  {/* Event Badge */}
                  <div className="flex-shrink-0 w-16">
                    {comm.isWicket && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                        WICKET
                      </span>
                    )}
                    {comm.isSix && (
                      <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
                        SIX
                      </span>
                    )}
                    {comm.isFour && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                        FOUR
                      </span>
                    )}
                    {comm.isWide && (
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">
                        Wide
                      </span>
                    )}
                    {comm.isNoBall && (
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">
                        No Ball
                      </span>
                    )}
                    {!comm.isWicket && !comm.isSix && !comm.isFour && !comm.isWide && !comm.isNoBall && (
                      <span className="px-2 py-1 bg-white/10 text-gray-400 text-xs rounded">
                        {comm.run} run{comm.run !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Commentary Text */}
                  <div className="flex-1">
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {comm.commentary}
                    </p>
                  </div>

                  {/* Runs */}
                  <div className="flex-shrink-0">
                    <span className={`text-lg font-bold ${
                      comm.run >= 6 ? 'text-yellow-400' :
                      comm.run >= 4 ? 'text-green-400' :
                      comm.run > 0 ? 'text-white' : 'text-gray-500'
                    }`}>
                      {comm.run}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}

