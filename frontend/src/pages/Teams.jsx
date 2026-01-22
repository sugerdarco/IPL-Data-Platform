import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import * as api from '../api'
import DataTable from '../components/DataTable'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'

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

export default function Teams() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [standings, setStandings] = useState([])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getStandings()
      setStandings(res.data)
    } catch (err) {
      setError(err.message || 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading standings..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  const columns = [
    {
      header: '#',
      accessor: 'position',
      render: (row, index) => (
        <span className={`font-bold ${index < 4 ? 'text-ipl-gold' : 'text-gray-500'}`}>
          {index + 1}
        </span>
      )
    },
    {
      header: 'Team',
      accessor: 'team',
      render: (row) => (
        <Link 
          to={`/teams/${row.team.id}`}
          className="flex items-center gap-3 group"
        >
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: TEAM_COLORS[row.team.abbr] || '#004BA0' }}
          >
            {row.team.abbr}
          </div>
          <div>
            <p className="font-medium text-white group-hover:text-ipl-gold transition-colors">
              {row.team.title}
            </p>
            <p className="text-xs text-gray-500">{row.team.abbr}</p>
          </div>
        </Link>
      )
    },
    {
      header: 'P',
      accessor: 'played',
      render: (row) => <span className="font-medium">{row.played}</span>
    },
    {
      header: 'W',
      accessor: 'win',
      render: (row) => <span className="text-green-400 font-medium">{row.win}</span>
    },
    {
      header: 'L',
      accessor: 'loss',
      render: (row) => <span className="text-red-400 font-medium">{row.loss}</span>
    },
    {
      header: 'NRR',
      accessor: 'netRunRate',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.netRunRate > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className={row.netRunRate > 0 ? 'text-green-400' : 'text-red-400'}>
            {row.netRunRate?.toFixed(3)}
          </span>
        </div>
      )
    },
    {
      header: 'Pts',
      accessor: 'points',
      render: (row) => (
        <span className="text-xl font-bold text-ipl-gold">{row.points}</span>
      )
    },
    {
      header: 'Form',
      accessor: 'lastFiveResults',
      render: (row) => (
        <div className="flex gap-1">
          {row.lastFiveResults?.split(',').map((result, i) => (
            <span
              key={i}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                result === 'W' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {result}
            </span>
          ))}
        </div>
      )
    },
    {
      header: '',
      accessor: 'actions',
      render: (row) => (
        <Link 
          to={`/teams/${row.team.id}`}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors inline-flex"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      )
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-ipl-gold" />
            Points Table
          </h1>
          <p className="text-gray-400 mt-1">IPL 2022 Season Standings</p>
        </div>
      </div>

      {/* Qualified teams indicator */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-ipl-gold" />
          <span className="text-gray-400">Qualified for playoffs</span>
        </div>
      </div>

      {/* Standings Table */}
      <DataTable
        columns={columns}
        data={standings}
        loading={loading}
        emptyMessage="No standings data available"
      />

      {/* Team Cards Grid */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">All Teams</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {standings.map((standing, index) => (
            <motion.div
              key={standing.team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/teams/${standing.team.id}`}
                className="block glass-card rounded-2xl p-6 text-center border border-white/5 hover:border-ipl-gold/30 transition-all group"
                style={{ 
                  borderTopColor: TEAM_COLORS[standing.team.abbr] || '#004BA0',
                  borderTopWidth: '3px'
                }}
              >
                {standing.team.logoUrl && (
                  <img 
                    src={standing.team.logoUrl} 
                    alt={standing.team.title}
                    className="w-16 h-16 mx-auto mb-4 object-contain"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
                <h3 className="font-semibold text-white group-hover:text-ipl-gold transition-colors">
                  {standing.team.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {standing.win}W - {standing.loss}L
                </p>
                <div className="mt-3 text-2xl font-display text-ipl-gold">
                  {standing.points} pts
                </div>
                {standing.qualified && (
                  <span className="inline-block mt-2 px-2 py-1 bg-ipl-gold/20 text-ipl-gold text-xs rounded-full">
                    Qualified
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

