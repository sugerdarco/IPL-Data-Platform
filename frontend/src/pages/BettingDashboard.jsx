import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Trophy, 
  Users, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
  ChevronRight,
  Percent,
  BarChart3
} from 'lucide-react'
import * as api from '../api'
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

const RiskBadge = ({ level }) => {
  const configs = {
    1: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Very Safe' },
    2: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Safe' },
    3: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Moderate' },
    4: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Risky' },
    5: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Avoid' },
  }
  const config = configs[level] || configs[3]
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  )
}

const StarRating = ({ stars }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= stars ? 'text-ipl-gold fill-ipl-gold' : 'text-gray-600'}`}
        />
      ))}
    </div>
  )
}

const ProbabilityBar = ({ value, color = 'ipl-gold' }) => {
  return (
    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={`h-full bg-${color} rounded-full`}
        style={{ backgroundColor: value > 50 ? '#22c55e' : value > 30 ? '#eab308' : '#ef4444' }}
      />
    </div>
  )
}

export default function BettingDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [overview, setOverview] = useState(null)
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [riskData, setRiskData] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [overviewRes, teamsRes, playersRes, scenariosRes, riskRes] = await Promise.all([
        api.getBettingOverview(),
        api.getBettingTeams(),
        api.getBettingPlayers({ limit: 6 }),
        api.getBettingScenarios(),
        api.getRiskAssessment()
      ])
      setOverview(overviewRes.data)
      setTeams(teamsRes.data)
      setPlayers(playersRes.data)
      setScenarios(scenariosRes.data)
      setRiskData(riskRes.data)
    } catch (err) {
      setError(err.message || 'Failed to load betting data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading betting analytics..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-ipl-gold" />
            Betting Analytics
          </h1>
          <p className="text-gray-400 mt-1">IPL 2022 Betting Intelligence & Strategy Guide</p>
        </div>
        <Link 
          to="/betting/predictor"
          className="px-4 py-2 bg-ipl-gold text-ipl-dark rounded-lg font-medium hover:bg-ipl-gold/90 transition-colors flex items-center gap-2"
        >
          <Target className="w-5 h-5" />
          Match Predictor
        </Link>
      </div>

      {/* Key Insights Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {overview.keyInsights.map((insight, index) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-5 border border-white/5"
            >
              <div className="flex items-center gap-3 mb-3">
                {insight.icon === 'trophy' && <Trophy className="w-5 h-5 text-ipl-gold" />}
                {insight.icon === 'user' && <Users className="w-5 h-5 text-ipl-blue" />}
                {insight.icon === 'target' && <Target className="w-5 h-5 text-green-400" />}
                {insight.icon === 'zap' && <Zap className="w-5 h-5 text-yellow-400" />}
                <span className="text-gray-400 text-sm">{insight.title}</span>
              </div>
              <p className="text-white font-semibold">{insight.value}</p>
              <p className="text-2xl font-display text-ipl-gold mt-1">{insight.probability}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Safe Bets & Avoid Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Safe Bets */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6 border border-green-500/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Safe Bets</h2>
              <p className="text-sm text-gray-400">High probability, low risk</p>
            </div>
          </div>
          <div className="space-y-3">
            {riskData?.SAFE_BETS?.map((bet, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: TEAM_COLORS[bet.team] || '#004BA0' }}
                  >
                    {bet.team}
                  </div>
                  <span className="text-white text-sm">{bet.bet}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-semibold">{bet.probability}%</span>
                  <StarRating stars={bet.stars} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Avoid Bets */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6 border border-red-500/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-500/20">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Avoid These Bets</h2>
              <p className="text-sm text-gray-400">Low probability, high risk</p>
            </div>
          </div>
          <div className="space-y-3">
            {riskData?.AVOID_BETS?.map((bet, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: TEAM_COLORS[bet.team] || '#004BA0' }}
                  >
                    {bet.team?.substring(0, 2)}
                  </div>
                  <div>
                    <span className="text-white text-sm block">{bet.bet}</span>
                    <span className="text-red-400 text-xs">{bet.reason}</span>
                  </div>
                </div>
                <span className="text-red-400 font-semibold">{bet.probability}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Team Betting Strategies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-ipl-gold" />
            Team Betting Strategies
          </h2>
          <Link to="/betting/teams" className="text-ipl-blue hover:text-ipl-gold transition-colors text-sm flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.slice(0, 6).map((team, index) => (
            <motion.div
              key={team.abbr}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-xl p-5 border border-white/5 hover:border-ipl-gold/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: TEAM_COLORS[team.abbr] || '#004BA0' }}
                  >
                    {team.abbr}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{team.name}</p>
                    <p className="text-xs text-gray-500">Win Rate: {team.winRate}%</p>
                  </div>
                </div>
                <RiskBadge level={team.riskLevel} />
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3 text-center">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-gray-400">Batting First</p>
                  <p className="text-lg font-semibold text-white">{team.battingFirstWinRate}%</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-gray-400">Chasing</p>
                  <p className="text-lg font-semibold text-white">{team.chasingWinRate}%</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-300 mb-2">{team.strategy}</p>
              
              <div className="flex items-center gap-2">
                {team.recommendation === 'STRONG_BET' && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                    ✓ Strong Bet
                  </span>
                )}
                {team.recommendation === 'STRONG_AVOID' && (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                    ✗ Avoid
                  </span>
                )}
                {team.recommendation === 'GOOD_BET' && (
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
                    ✓ Good Bet
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Top Player Bets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-ipl-blue" />
            Top Player Betting Picks
          </h2>
          <Link to="/betting/players" className="text-ipl-blue hover:text-ipl-gold transition-colors text-sm flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-xl p-5 border border-white/5 hover:border-ipl-gold/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: TEAM_COLORS[player.team] || '#004BA0' }}
                >
                  {player.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{player.name}</p>
                  <p className="text-xs text-gray-400">{player.team} • {player.role}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-gray-400">Runs</p>
                  <p className="text-sm font-semibold text-white">{player.runs}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-gray-400">Avg</p>
                  <p className="text-sm font-semibold text-white">{player.average?.toFixed(1)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-gray-400">SR</p>
                  <p className="text-sm font-semibold text-white">{player.strikeRate?.toFixed(1)}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-3">
                {player.bettingTips?.slice(0, 2).map((tip, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{tip.type}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${tip.probability > 40 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {tip.probability}%
                      </span>
                      <StarRating stars={tip.stars} />
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-ipl-gold font-medium">{player.verdict}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Match Scenarios */}
      <div>
        <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-green-400" />
          Match Scenario Betting
        </h2>
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Scenario</th>
                <th className="text-center p-4 text-gray-400 font-medium">Probability</th>
                <th className="text-center p-4 text-gray-400 font-medium">Recommendation</th>
                <th className="text-left p-4 text-gray-400 font-medium">Reasoning</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario, index) => (
                <tr key={index} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white font-medium">{scenario.scenario}</td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`font-semibold ${
                        (scenario.winProbability || scenario.probability) > 50 ? 'text-green-400' : 
                        (scenario.winProbability || scenario.probability) > 30 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {scenario.winProbability || scenario.probability}%
                      </span>
                      <ProbabilityBar value={scenario.winProbability || scenario.probability} />
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      scenario.recommendation?.includes('STRONG') || scenario.recommendation?.includes('BET') 
                        ? 'bg-green-500/20 text-green-400' 
                        : scenario.recommendation === 'AVOID'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {scenario.recommendation?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300 text-sm max-w-md">{scenario.reasoning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tournament Stats */}
      {overview?.tournamentStats && (
        <div className="glass-card rounded-2xl p-6 border border-white/5">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-ipl-gold" />
            Tournament Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-display text-ipl-gold">{overview.tournamentStats.totalMatches}</p>
              <p className="text-sm text-gray-400 mt-1">Total Matches</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-display text-ipl-gold">{overview.tournamentStats.totalCenturies}</p>
              <p className="text-sm text-gray-400 mt-1">Centuries</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-display text-ipl-gold">{overview.tournamentStats.centuryRate}</p>
              <p className="text-sm text-gray-400 mt-1">Century Rate</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-display text-ipl-gold">{overview.tournamentStats.avgMatchScore}</p>
              <p className="text-sm text-gray-400 mt-1">Avg Score</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xl font-display text-green-400">{overview.tournamentStats.highestScore}</p>
              <p className="text-sm text-gray-400 mt-1">Highest</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xl font-display text-red-400">{overview.tournamentStats.lowestScore}</p>
              <p className="text-sm text-gray-400 mt-1">Lowest</p>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="glass-card rounded-xl p-4 border border-yellow-500/20 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-400">
          <span className="text-yellow-400 font-medium">Disclaimer:</span> This analysis is for educational and analytical purposes only. 
          Betting involves risk. Past performance does not guarantee future results. Always gamble responsibly.
        </p>
      </div>
    </div>
  )
}

