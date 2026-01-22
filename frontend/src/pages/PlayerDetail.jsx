import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Target, Zap, Award, Calendar } from 'lucide-react'
import * as api from '../api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'

export default function PlayerDetail() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [player, setPlayer] = useState(null)
  const [battingRecords, setBattingRecords] = useState([])
  const [bowlingRecords, setBowlingRecords] = useState([])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [playerRes, battingRes, bowlingRes] = await Promise.all([
        api.getPlayer(id),
        api.getPlayerBatting(id),
        api.getPlayerBowling(id)
      ])
      setPlayer(playerRes.data)
      setBattingRecords(battingRes.data)
      setBowlingRecords(bowlingRes.data)
    } catch (err) {
      setError(err.message || 'Failed to load player details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading player details..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  if (!player) {
    return <ErrorState title="Player not found" message="The requested player could not be found." />
  }

  const team = player.squads?.[0]?.team
  const battingStats = player.battingStats?.[0]
  const bowlingStats = player.bowlingStats?.[0]

  // Calculate aggregated stats from records
  const totalRuns = battingRecords.reduce((sum, r) => sum + r.runs, 0)
  const totalWickets = bowlingRecords.reduce((sum, r) => sum + r.wickets, 0)
  const highestScore = battingRecords.length > 0 ? Math.max(...battingRecords.map(r => r.runs)) : 0

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link 
        to="/players" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Players
      </Link>

      {/* Player Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 border border-ipl-gold/20 overflow-hidden relative"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ipl-gold to-ipl-blue flex items-center justify-center text-4xl font-display text-white">
            {player.shortName?.charAt(0) || player.title.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-display text-white mb-2">{player.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-400">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                player.playingRole === 'bat' ? 'bg-green-500/20 text-green-400' :
                player.playingRole === 'bowl' ? 'bg-blue-500/20 text-blue-400' :
                player.playingRole === 'all' ? 'bg-purple-500/20 text-purple-400' :
                'bg-orange-500/20 text-orange-400'
              }`}>
                {player.playingRole?.toUpperCase()}
              </span>
              {team && (
                <Link to={`/teams/${team.id}`} className="hover:text-ipl-gold transition-colors">
                  {team.title}
                </Link>
              )}
              <span>{player.country}</span>
            </div>
          </div>
        </div>

        {/* Player Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          {player.battingStyle && (
            <div>
              <p className="text-xs text-gray-500">Batting</p>
              <p className="text-white">{player.battingStyle}</p>
            </div>
          )}
          {player.bowlingStyle && (
            <div>
              <p className="text-xs text-gray-500">Bowling</p>
              <p className="text-white">{player.bowlingStyle}</p>
            </div>
          )}
          {player.birthdate && (
            <div>
              <p className="text-xs text-gray-500">Born</p>
              <p className="text-white">{player.birthdate}</p>
            </div>
          )}
          {player.birthplace && (
            <div>
              <p className="text-xs text-gray-500">Birthplace</p>
              <p className="text-white">{player.birthplace}</p>
            </div>
          )}
        </div>
        
        {/* Decorative */}
        <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-ipl-gold/10" />
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-6 text-center border border-ipl-gold/20"
        >
          <Target className="w-6 h-6 text-ipl-gold mx-auto mb-2" />
          <p className="text-3xl font-display text-ipl-gold">{totalRuns}</p>
          <p className="text-xs text-gray-500">Total Runs</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-6 text-center border border-ipl-blue/20"
        >
          <Zap className="w-6 h-6 text-ipl-blue mx-auto mb-2" />
          <p className="text-3xl font-display text-ipl-blue">{totalWickets}</p>
          <p className="text-xs text-gray-500">Total Wickets</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6 text-center border border-green-500/20"
        >
          <Award className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-3xl font-display text-green-400">{highestScore}</p>
          <p className="text-xs text-gray-500">Highest Score</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl p-6 text-center border border-purple-500/20"
        >
          <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-3xl font-display text-purple-400">{battingRecords.length}</p>
          <p className="text-xs text-gray-500">Innings</p>
        </motion.div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Batting Stats */}
        {battingStats && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-2xl p-6 border border-ipl-gold/10"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-ipl-gold" />
              Batting Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Matches</p>
                <p className="text-xl font-semibold text-white">{battingStats.matches}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Innings</p>
                <p className="text-xl font-semibold text-white">{battingStats.innings}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Runs</p>
                <p className="text-xl font-semibold text-ipl-gold">{battingStats.runs}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Average</p>
                <p className="text-xl font-semibold text-white">{battingStats.average?.toFixed(2) || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Strike Rate</p>
                <p className="text-xl font-semibold text-white">{battingStats.strikeRate?.toFixed(2) || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Highest</p>
                <p className="text-xl font-semibold text-white">{battingStats.highest || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">50s</p>
                <p className="text-xl font-semibold text-white">{battingStats.fifties}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">100s</p>
                <p className="text-xl font-semibold text-white">{battingStats.centuries}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">4s</p>
                <p className="text-xl font-semibold text-white">{battingStats.fours}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">6s</p>
                <p className="text-xl font-semibold text-white">{battingStats.sixes}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bowling Stats */}
        {bowlingStats && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card rounded-2xl p-6 border border-ipl-blue/10"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-ipl-blue" />
              Bowling Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Matches</p>
                <p className="text-xl font-semibold text-white">{bowlingStats.matches}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Overs</p>
                <p className="text-xl font-semibold text-white">{bowlingStats.overs}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Wickets</p>
                <p className="text-xl font-semibold text-ipl-blue">{bowlingStats.wickets}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Economy</p>
                <p className="text-xl font-semibold text-white">{bowlingStats.economy?.toFixed(2) || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Average</p>
                <p className="text-xl font-semibold text-white">{bowlingStats.average?.toFixed(2) || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Strike Rate</p>
                <p className="text-xl font-semibold text-white">{bowlingStats.strikeRate?.toFixed(2) || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Best Innings</p>
                <p className="text-xl font-semibold text-white">{bowlingStats.bestInning || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">4W/5W</p>
                <p className="text-xl font-semibold text-white">{bowlingStats.wicket4i || 0}/{bowlingStats.wicket5i || 0}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Match Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card rounded-2xl p-6 border border-ipl-gold/10"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Match-by-Match Performance</h3>
        
        {battingRecords.length === 0 && bowlingRecords.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No match records available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Match</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Runs</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Balls</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">4s</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">6s</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">SR</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Dismissal</th>
                </tr>
              </thead>
              <tbody>
                {battingRecords.slice(0, 10).map((record, index) => (
                  <tr key={index} className="border-b border-white/5 table-row-hover">
                    <td className="px-4 py-3">
                      <Link 
                        to={`/matches/${record.innings?.match?.id}`}
                        className="text-white hover:text-ipl-gold transition-colors"
                      >
                        {record.innings?.match?.shortTitle || 'Match'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-bold text-ipl-gold">{record.runs}</td>
                    <td className="px-4 py-3 text-gray-400">{record.ballsFaced}</td>
                    <td className="px-4 py-3 text-gray-400">{record.fours}</td>
                    <td className="px-4 py-3 text-gray-400">{record.sixes}</td>
                    <td className="px-4 py-3 text-gray-400">{record.strikeRate?.toFixed(2) || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{record.howOut || 'Not out'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}

