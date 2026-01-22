import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Calendar, Trophy, TrendingUp } from 'lucide-react'
import * as api from '../api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import DataTable from '../components/DataTable'

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

export default function TeamDetail() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [teamRes, playersRes, matchesRes] = await Promise.all([
        api.getTeam(id),
        api.getTeamPlayers(id),
        api.getTeamMatches(id, { limit: 10 })
      ])
      setTeam(teamRes.data)
      setPlayers(playersRes.data)
      setMatches(matchesRes.data.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load team details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading team details..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  if (!team) {
    return <ErrorState title="Team not found" message="The requested team could not be found." />
  }

  const teamColor = TEAM_COLORS[team.abbr] || '#004BA0'
  const standing = team.standings?.[0]

  const playerColumns = [
    {
      header: 'Player',
      accessor: 'title',
      render: (row) => (
        <Link to={`/players/${row.id}`} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-ipl-navy flex items-center justify-center text-xs font-bold text-white">
            {row.shortName?.charAt(0) || row.title.charAt(0)}
          </div>
          <span className="text-white group-hover:text-ipl-gold transition-colors">
            {row.title}
          </span>
        </Link>
      )
    },
    {
      header: 'Role',
      accessor: 'playingRole',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.playingRole === 'bat' ? 'bg-green-500/20 text-green-400' :
          row.playingRole === 'bowl' ? 'bg-blue-500/20 text-blue-400' :
          row.playingRole === 'all' ? 'bg-purple-500/20 text-purple-400' :
          'bg-orange-500/20 text-orange-400'
        }`}>
          {row.playingRole?.toUpperCase()}
        </span>
      )
    },
    {
      header: 'Batting',
      accessor: 'battingStyle'
    },
    {
      header: 'Bowling',
      accessor: 'bowlingStyle',
      render: (row) => row.bowlingStyle || '-'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link 
        to="/teams" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Teams
      </Link>

      {/* Team Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 border border-white/10 overflow-hidden relative"
        style={{ borderTopColor: teamColor, borderTopWidth: '4px' }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {team.logoUrl && (
            <img 
              src={team.logoUrl} 
              alt={team.title}
              className="w-24 h-24 object-contain"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-display text-white mb-2">{team.title}</h1>
            <p className="text-gray-400">{team.abbr} • {team.country?.toUpperCase()}</p>
          </div>
          
          {standing && (
            <div className="flex flex-wrap gap-6">
              <div className="text-center">
                <p className="text-3xl font-display text-ipl-gold">{standing.points}</p>
                <p className="text-xs text-gray-500">POINTS</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-display text-green-400">{standing.win}</p>
                <p className="text-xs text-gray-500">WON</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-display text-red-400">{standing.loss}</p>
                <p className="text-xs text-gray-500">LOST</p>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-display ${standing.netRunRate > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {standing.netRunRate?.toFixed(3)}
                </p>
                <p className="text-xs text-gray-500">NRR</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Decorative */}
        <div 
          className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full opacity-10"
          style={{ backgroundColor: teamColor }}
        />
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <Users className="w-6 h-6 text-ipl-gold mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{players.length}</p>
          <p className="text-xs text-gray-500">Squad Size</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Calendar className="w-6 h-6 text-ipl-blue mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{standing?.played || 0}</p>
          <p className="text-xs text-gray-500">Matches</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {standing?.played ? ((standing.win / standing.played) * 100).toFixed(0) : 0}%
          </p>
          <p className="text-xs text-gray-500">Win Rate</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{team.teamStats?.totalRuns || 0}</p>
          <p className="text-xs text-gray-500">Total Runs</p>
        </div>
      </div>

      {/* Squad */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-ipl-gold" />
          Squad
        </h2>
        <DataTable
          columns={playerColumns}
          data={players}
          loading={false}
          emptyMessage="No players found"
        />
      </div>

      {/* Recent Matches */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-ipl-gold" />
          Recent Matches
        </h2>
        <div className="space-y-3">
          {matches.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No matches found</p>
          ) : (
            matches.map((match) => (
              <Link
                key={match.id}
                to={`/matches/${match.id}`}
                className="block glass-card rounded-xl p-4 border border-white/5 hover:border-ipl-gold/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`font-medium ${match.teamAId === team.id ? 'text-white' : 'text-gray-400'}`}>
                      {match.teamA?.abbr}
                    </span>
                    <span className="text-gray-600">vs</span>
                    <span className={`font-medium ${match.teamBId === team.id ? 'text-white' : 'text-gray-400'}`}>
                      {match.teamB?.abbr}
                    </span>
                  </div>
                  <div className="text-right">
                    {match.winningTeamId === team.id ? (
                      <span className="text-green-400 font-medium">Won</span>
                    ) : match.winningTeamId ? (
                      <span className="text-red-400 font-medium">Lost</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(match.dateStart).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {match.result && (
                  <p className="text-sm text-gray-400 mt-2">{match.result}</p>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

