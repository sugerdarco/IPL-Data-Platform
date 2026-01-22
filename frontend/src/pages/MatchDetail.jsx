import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, MapPin, Trophy, Users, Target, Circle, MessageSquare } from 'lucide-react'
import * as api from '../api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import WagonWheel from '../components/WagonWheel'
import Commentary from '../components/Commentary'

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

export default function MatchDetail() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [match, setMatch] = useState(null)
  const [activeInnings, setActiveInnings] = useState(0)
  const [activeTab, setActiveTab] = useState('scorecard') // scorecard, wagon, commentary
  
  // Wagon wheel state
  const [wagonData, setWagonData] = useState(null)
  const [wagonLoading, setWagonLoading] = useState(false)
  
  // Commentary state
  const [commentaryData, setCommentaryData] = useState(null)
  const [commentaryLoading, setCommentaryLoading] = useState(false)
  const [commentaryPage, setCommentaryPage] = useState(1)
  const [commentaryFilters, setCommentaryFilters] = useState({})

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getMatch(id)
      setMatch(res.data)
    } catch (err) {
      setError(err.message || 'Failed to load match details')
    } finally {
      setLoading(false)
    }
  }

  const fetchWagonWheel = async () => {
    try {
      setWagonLoading(true)
      const res = await api.getMatchWagonWheel(id)
      setWagonData(res.data)
    } catch (err) {
      console.error('Failed to load wagon wheel:', err)
    } finally {
      setWagonLoading(false)
    }
  }

  const fetchCommentary = async (page = 1, filters = {}) => {
    try {
      setCommentaryLoading(true)
      const res = await api.getMatchCommentary(id, { page, limit: 50, ...filters })
      setCommentaryData(res.data)
      setCommentaryPage(page)
    } catch (err) {
      console.error('Failed to load commentary:', err)
    } finally {
      setCommentaryLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  useEffect(() => {
    if (activeTab === 'wagon' && !wagonData) {
      fetchWagonWheel()
    }
    if (activeTab === 'commentary' && !commentaryData) {
      fetchCommentary()
    }
  }, [activeTab])

  const handleCommentaryFilterChange = (filters) => {
    setCommentaryFilters(filters)
    fetchCommentary(1, filters)
  }

  const handleCommentaryPageChange = (page) => {
    fetchCommentary(page, commentaryFilters)
  }

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading match details..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  if (!match) {
    return <ErrorState title="Match not found" message="The requested match could not be found." />
  }

  const innings = match.innings || []
  const currentInnings = innings[activeInnings]

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link 
        to="/matches" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Matches
      </Link>

      {/* Match Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 border border-ipl-gold/20 overflow-hidden relative"
      >
        {/* Match Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(match.dateStart).toLocaleDateString('en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {match.venue?.name}, {match.venue?.location}
          </span>
          <span className="text-ipl-gold">{match.matchNumber}</span>
        </div>

        {/* Teams Scorecard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Team A */}
          <div className="text-center md:text-left">
            <Link 
              to={`/teams/${match.teamA?.id}`}
              className="inline-flex flex-col items-center md:items-start group"
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2"
                style={{ backgroundColor: TEAM_COLORS[match.teamA?.abbr] || '#004BA0' }}
              >
                {match.teamA?.abbr}
              </div>
              <h3 className="text-xl font-semibold text-white group-hover:text-ipl-gold transition-colors">
                {match.teamA?.title}
              </h3>
            </Link>
            <p className="text-3xl font-display text-white mt-2">
              {match.teamAScoresFull || '-'}
            </p>
          </div>

          {/* VS */}
          <div className="text-center">
            <div className="text-4xl font-display text-gray-600">VS</div>
            {match.winningTeam && (
              <div className="mt-4">
                <Trophy className="w-6 h-6 text-ipl-gold mx-auto mb-1" />
                <p className="text-sm text-ipl-gold font-medium">
                  {match.winningTeam.abbr} Won
                </p>
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="text-center md:text-right">
            <Link 
              to={`/teams/${match.teamB?.id}`}
              className="inline-flex flex-col items-center md:items-end group"
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2"
                style={{ backgroundColor: TEAM_COLORS[match.teamB?.abbr] || '#004BA0' }}
              >
                {match.teamB?.abbr}
              </div>
              <h3 className="text-xl font-semibold text-white group-hover:text-ipl-gold transition-colors">
                {match.teamB?.title}
              </h3>
            </Link>
            <p className="text-3xl font-display text-white mt-2">
              {match.teamBScoresFull || '-'}
            </p>
          </div>
        </div>

        {/* Result */}
        {match.result && (
          <div className="text-center mt-6 pt-6 border-t border-white/10">
            <p className="text-gray-300">{match.result}</p>
          </div>
        )}

        {/* Toss */}
        {match.tossText && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">{match.tossText}</p>
          </div>
        )}
        
        {/* Decorative */}
        <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-ipl-gold/10" />
      </motion.div>

      {/* Main Tabs: Scorecard, Wagon Wheel, Commentary */}
      <div className="flex gap-2 border-b border-white/10 pb-2 mb-6">
        <button
          onClick={() => setActiveTab('scorecard')}
          className={`px-5 py-2.5 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'scorecard'
              ? 'bg-ipl-gold text-ipl-navy'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Target className="w-4 h-4" />
          Scorecard
        </button>
        <button
          onClick={() => setActiveTab('wagon')}
          className={`px-5 py-2.5 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'wagon'
              ? 'bg-ipl-gold text-ipl-navy'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Circle className="w-4 h-4" />
          Wagon Wheel
        </button>
        <button
          onClick={() => setActiveTab('commentary')}
          className={`px-5 py-2.5 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'commentary'
              ? 'bg-ipl-gold text-ipl-navy'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Commentary
        </button>
      </div>

      {/* Wagon Wheel Tab */}
      {activeTab === 'wagon' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Circle className="w-5 h-5 text-ipl-gold" />
            Wagon Wheel Analysis
          </h3>
          {wagonLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-ipl-gold border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-400 mt-3">Loading wagon wheel data...</p>
            </div>
          ) : wagonData ? (
            <WagonWheel data={wagonData} />
          ) : (
            <div className="text-center py-12 text-gray-400">
              No wagon wheel data available for this match.
            </div>
          )}
        </motion.div>
      )}

      {/* Commentary Tab */}
      {activeTab === 'commentary' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 border border-white/10"
        >
          <Commentary 
            data={commentaryData}
            loading={commentaryLoading}
            onFilterChange={handleCommentaryFilterChange}
            onPageChange={handleCommentaryPageChange}
            currentPage={commentaryPage}
            totalPages={commentaryData?.pagination?.totalPages || 1}
          />
        </motion.div>
      )}

      {/* Scorecard Tab - Innings Selector */}
      {activeTab === 'scorecard' && innings.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {innings.map((inn, index) => (
            <button
              key={inn.id}
              onClick={() => setActiveInnings(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeInnings === index
                  ? 'bg-ipl-gold text-ipl-navy'
                  : 'bg-ipl-navy/50 text-gray-400 hover:text-white'
              }`}
            >
              {inn.battingTeam?.abbr} - {inn.scoresFull}
            </button>
          ))}
        </div>
      )}

      {/* Scorecard */}
      {activeTab === 'scorecard' && currentInnings && (
        <motion.div
          key={activeInnings}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Batting */}
          <div className="glass-card rounded-2xl overflow-hidden border border-ipl-gold/10">
            <div className="px-6 py-4 bg-ipl-navy/30 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-ipl-gold" />
                {currentInnings.battingTeam?.title} Batting
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-ipl-navy/20">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Batter</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Dismissal</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">R</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">B</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">4s</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">6s</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInnings.batsmen?.map((batsman, index) => (
                    <tr key={index} className="border-b border-white/5 table-row-hover">
                      <td className="px-4 py-3">
                        <Link 
                          to={`/players/${batsman.player?.id}`}
                          className="text-white hover:text-ipl-gold transition-colors font-medium"
                        >
                          {batsman.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm max-w-[200px] truncate">
                        {batsman.howOut || 'not out'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-ipl-gold">
                        {batsman.runs}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {batsman.ballsFaced}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {batsman.fours}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {batsman.sixes}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {batsman.strikeRate?.toFixed(2) || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-ipl-navy/30">
                    <td colSpan="2" className="px-4 py-3 text-white font-semibold">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-ipl-gold">
                      {currentInnings.runs}
                    </td>
                    <td colSpan="4" className="px-4 py-3 text-right text-gray-400">
                      ({currentInnings.overs} Ov, {currentInnings.wickets} Wkts)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Bowling */}
          <div className="glass-card rounded-2xl overflow-hidden border border-ipl-blue/10">
            <div className="px-6 py-4 bg-ipl-navy/30 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-ipl-blue" />
                {currentInnings.fieldingTeam?.title} Bowling
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-ipl-navy/20">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Bowler</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">O</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">M</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">R</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">W</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInnings.bowlers?.map((bowler, index) => (
                    <tr key={index} className="border-b border-white/5 table-row-hover">
                      <td className="px-4 py-3">
                        <Link 
                          to={`/players/${bowler.player?.id}`}
                          className="text-white hover:text-ipl-gold transition-colors font-medium"
                        >
                          {bowler.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {bowler.overs}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {bowler.maidens}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {bowler.runsConceded}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-ipl-blue">
                        {bowler.wickets}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {bowler.economy?.toFixed(2) || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fall of Wickets */}
          {currentInnings.fallOfWickets?.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Fall of Wickets</h3>
              <div className="flex flex-wrap gap-3">
                {currentInnings.fallOfWickets.map((fow, index) => (
                  <div 
                    key={index}
                    className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm"
                  >
                    <span className="text-red-400 font-bold">{fow.score}</span>
                    <span className="text-gray-500 ml-2">({fow.name}, {fow.overs} ov)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

