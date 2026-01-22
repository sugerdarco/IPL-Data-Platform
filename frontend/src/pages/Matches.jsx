import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react'
import * as api from '../api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

const TEAM_COLORS = {
  'GT': '#1C2951',
  'RR': '#EA1A85',
  'LSG': '#A4DE02',
  'RCB': '#EC1C24',
  'DC': '#0078BC',
  'PBKS': '#ED1B24',
  'KKR': '#3A225D',
  'SRH': '#FF822A',
  'CSK': '#FFCB05',
  'MI': '#004BA0'
}

export default function Matches() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [matches, setMatches] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getMatches({ page, limit: 12 })
      setMatches(res.data.data)
      setPagination(res.data.pagination)
    } catch (err) {
      setError(err.message || 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page])

  if (loading && matches.length === 0) {
    return <LoadingSpinner size="lg" text="Loading matches..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display text-white flex items-center gap-3">
          <Calendar className="w-8 h-8 text-ipl-gold" />
          Matches
        </h1>
        <p className="text-gray-400 mt-1">IPL 2022 Season Fixtures & Results</p>
      </div>

      {/* Match List */}
      {matches.length === 0 ? (
        <EmptyState 
          title="No matches found" 
          message="There are no matches to display."
          icon={Calendar}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Link
                to={`/matches/${match.id}`}
                className="block glass-card rounded-2xl p-5 border border-white/5 hover:border-ipl-gold/30 transition-all group"
              >
                {/* Match Number & Date */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500 font-medium">
                    {match.matchNumber}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(match.dateStart).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>

                {/* Teams */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: TEAM_COLORS[match.teamA?.abbr] || '#004BA0' }}
                      >
                        {match.teamA?.abbr}
                      </div>
                      <span className={`font-medium ${
                        match.winningTeamId === match.teamA?.id ? 'text-ipl-gold' : 'text-white'
                      }`}>
                        {match.teamA?.abbr}
                      </span>
                    </div>
                    <span className={`text-lg font-bold ${
                      match.winningTeamId === match.teamA?.id ? 'text-ipl-gold' : 'text-gray-400'
                    }`}>
                      {match.teamAScores || '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: TEAM_COLORS[match.teamB?.abbr] || '#004BA0' }}
                      >
                        {match.teamB?.abbr}
                      </div>
                      <span className={`font-medium ${
                        match.winningTeamId === match.teamB?.id ? 'text-ipl-gold' : 'text-white'
                      }`}>
                        {match.teamB?.abbr}
                      </span>
                    </div>
                    <span className={`text-lg font-bold ${
                      match.winningTeamId === match.teamB?.id ? 'text-ipl-gold' : 'text-gray-400'
                    }`}>
                      {match.teamBScores || '-'}
                    </span>
                  </div>
                </div>

                {/* Result */}
                {match.result && (
                  <p className="text-sm text-gray-400 mt-4 line-clamp-2">
                    {match.result}
                  </p>
                )}

                {/* Venue */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-500 flex items-center gap-1 truncate max-w-[70%]">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {match.venue?.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-ipl-gold transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-ipl-navy/50 text-gray-400 rounded-lg hover:text-white hover:bg-ipl-navy disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
              const pageNum = i + 1 + Math.max(0, page - 3)
              if (pageNum > pagination.totalPages) return null
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-ipl-gold text-ipl-navy'
                      : 'bg-ipl-navy/50 text-gray-400 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 bg-ipl-navy/50 text-gray-400 rounded-lg hover:text-white hover:bg-ipl-navy disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

